/**
 * LBS 地理位置推荐算法
 * 基于用户地理位置进行附近的人推荐
 */

export interface Location {
  latitude: number; // 纬度
  longitude: number; // 经度
}

export interface UserLocation {
  userId: number;
  location: Location;
  updateTime: number; // 位置更新时间戳
}

/**
 * 地球半径（千米）
 */
const EARTH_RADIUS_KM = 6371;

/**
 * 将角度转换为弧度
 * @param degrees 角度
 * @returns 弧度
 */
function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * 计算两点之间的距离（Haversine 公式）
 * 这是计算地球表面两点间最短距离的标准方法
 *
 * @param loc1 位置1
 * @param loc2 位置2
 * @returns 距离（千米）
 */
export function calculateDistance(loc1: Location, loc2: Location): number {
  const lat1 = toRadians(loc1.latitude);
  const lat2 = toRadians(loc2.latitude);
  const deltaLat = toRadians(loc2.latitude - loc1.latitude);
  const deltaLon = toRadians(loc2.longitude - loc1.longitude);

  // Haversine 公式
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

/**
 * 计算距离权重
 * 距离越近权重越高，使用反比例函数
 *
 * @param distance 距离（千米）
 * @param maxDistance 最大有效距离（千米）
 * @returns 权重 (0-1)
 */
export function calculateDistanceWeight(
  distance: number,
  maxDistance: number = 20
): number {
  if (distance > maxDistance) {
    return 0;
  }

  // 权重 = 1 / (1 + 距离/10)
  // 距离0km: 权重1.0
  // 距离5km: 权重0.67
  // 距离10km: 权重0.5
  // 距离20km: 权重0.33
  return 1 / (1 + distance / 10);
}

/**
 * 格式化距离显示
 * @param distance 距离（千米）
 * @returns 格式化的距离字符串
 */
export function formatDistance(distance: number): string {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  } else if (distance < 10) {
    return `${distance.toFixed(1)}km`;
  } else {
    return `${Math.round(distance)}km`;
  }
}

/**
 * 查找附近的用户
 * @param currentLocation 当前用户位置
 * @param allUserLocations 所有用户位置列表
 * @param options 配置选项
 * @returns 附近用户列表（按距离升序）
 */
export function findNearbyUsers(
  currentLocation: Location,
  allUserLocations: UserLocation[],
  options: {
    maxDistance?: number; // 最大距离（千米）
    maxResults?: number; // 最大返回数量
    excludeUserIds?: Set<number>; // 需要排除的用户ID
    locationFreshnessHours?: number; // 位置新鲜度（小时）
  } = {}
): Array<{
  userId: number;
  distance: number;
  distanceText: string;
  weight: number;
  location: Location;
}> {
  const {
    maxDistance = 20,
    maxResults = 50,
    excludeUserIds = new Set(),
    locationFreshnessHours = 24,
  } = options;

  const currentTime = Date.now();
  const freshnessThreshold = locationFreshnessHours * 60 * 60 * 1000;

  // 计算每个用户的距离
  const nearbyUsers = allUserLocations
    .filter((userLoc) => {
      // 排除指定用户
      if (excludeUserIds.has(userLoc.userId)) {
        return false;
      }

      // 检查位置新鲜度
      const locationAge = currentTime - userLoc.updateTime;
      if (locationAge > freshnessThreshold) {
        return false;
      }

      return true;
    })
    .map((userLoc) => {
      const distance = calculateDistance(currentLocation, userLoc.location);
      return {
        userId: userLoc.userId,
        distance,
        distanceText: formatDistance(distance),
        weight: calculateDistanceWeight(distance, maxDistance),
        location: userLoc.location,
      };
    })
    .filter((user) => user.distance <= maxDistance && user.weight > 0)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, maxResults);

  return nearbyUsers;
}

/**
 * 地理围栏检测
 * 检查用户是否在指定区域内
 *
 * @param userLocation 用户位置
 * @param center 区域中心点
 * @param radius 半径（千米）
 * @returns 是否在区域内
 */
export function isInGeofence(
  userLocation: Location,
  center: Location,
  radius: number
): boolean {
  const distance = calculateDistance(userLocation, center);
  return distance <= radius;
}

/**
 * 计算边界框（用于数据库查询优化）
 * 给定中心点和半径，计算矩形边界框
 *
 * @param center 中心点
 * @param radiusKm 半径（千米）
 * @returns 边界框 { minLat, maxLat, minLon, maxLon }
 */
export function calculateBoundingBox(
  center: Location,
  radiusKm: number
): {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
} {
  // 纬度每度约111km
  const latDelta = radiusKm / 111;

  // 经度每度距离随纬度变化
  const lonDelta = radiusKm / (111 * Math.cos(toRadians(center.latitude)));

  return {
    minLat: center.latitude - latDelta,
    maxLat: center.latitude + latDelta,
    minLon: center.longitude - lonDelta,
    maxLon: center.longitude + lonDelta,
  };
}

/**
 * 网格化位置索引（用于快速查找）
 * 将地理位置映射到网格ID
 *
 * @param location 位置
 * @param gridSizeKm 网格大小（千米）
 * @returns 网格ID
 */
export function getGridId(location: Location, gridSizeKm: number = 1): string {
  const latGrid = Math.floor(location.latitude / (gridSizeKm / 111));
  const lonGrid = Math.floor(
    location.longitude / (gridSizeKm / (111 * Math.cos(toRadians(location.latitude))))
  );
  return `${latGrid},${lonGrid}`;
}

/**
 * 获取相邻网格ID列表（包括自身）
 * @param gridId 当前网格ID
 * @returns 相邻网格ID列表（9个）
 */
export function getAdjacentGridIds(gridId: string): string[] {
  const [latGrid, lonGrid] = gridId.split(',').map(Number);
  const adjacentIds: string[] = [];

  for (let latOffset = -1; latOffset <= 1; latOffset++) {
    for (let lonOffset = -1; lonOffset <= 1; lonOffset++) {
      adjacentIds.push(`${latGrid + latOffset},${lonGrid + lonOffset}`);
    }
  }

  return adjacentIds;
}

/**
 * 基于网格的快速附近用户查找
 * @param currentLocation 当前位置
 * @param userLocationGrid 用户位置网格索引
 * @param options 配置选项
 * @returns 附近用户列表
 */
export function findNearbyUsersWithGrid(
  currentLocation: Location,
  userLocationGrid: Map<string, UserLocation[]>,
  options: {
    maxDistance?: number;
    maxResults?: number;
    excludeUserIds?: Set<number>;
    gridSizeKm?: number;
  } = {}
): Array<{
  userId: number;
  distance: number;
  distanceText: string;
  weight: number;
}> {
  const { maxDistance = 20, maxResults = 50, excludeUserIds = new Set(), gridSizeKm = 1 } = options;

  // 获取当前位置的网格ID
  const currentGridId = getGridId(currentLocation, gridSizeKm);

  // 获取相邻网格ID
  const adjacentGridIds = getAdjacentGridIds(currentGridId);

  // 收集相邻网格中的所有用户
  const candidateUsers: UserLocation[] = [];
  adjacentGridIds.forEach((gridId) => {
    const usersInGrid = userLocationGrid.get(gridId) || [];
    candidateUsers.push(...usersInGrid);
  });

  // 计算距离并过滤
  const nearbyUsers = candidateUsers
    .filter((userLoc) => !excludeUserIds.has(userLoc.userId))
    .map((userLoc) => {
      const distance = calculateDistance(currentLocation, userLoc.location);
      return {
        userId: userLoc.userId,
        distance,
        distanceText: formatDistance(distance),
        weight: calculateDistanceWeight(distance, maxDistance),
      };
    })
    .filter((user) => user.distance <= maxDistance && user.weight > 0)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, maxResults);

  return nearbyUsers;
}

/**
 * 热力图数据生成
 * 统计指定区域内的用户密度
 *
 * @param userLocations 用户位置列表
 * @param bounds 区域边界
 * @param gridSize 网格大小
 * @returns 热力图数据
 */
export function generateHeatmapData(
  userLocations: UserLocation[],
  bounds: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  },
  gridSize: number = 0.01 // 约1km
): Array<{ lat: number; lon: number; count: number }> {
  const heatmap = new Map<string, number>();

  userLocations.forEach((userLoc) => {
    const { latitude, longitude } = userLoc.location;

    // 检查是否在边界内
    if (
      latitude >= bounds.minLat &&
      latitude <= bounds.maxLat &&
      longitude >= bounds.minLon &&
      longitude <= bounds.maxLon
    ) {
      // 计算网格坐标
      const latGrid = Math.floor(latitude / gridSize);
      const lonGrid = Math.floor(longitude / gridSize);
      const key = `${latGrid},${lonGrid}`;

      heatmap.set(key, (heatmap.get(key) || 0) + 1);
    }
  });

  // 转换为数组
  return Array.from(heatmap.entries()).map(([key, count]) => {
    const [latGrid, lonGrid] = key.split(',').map(Number);
    return {
      lat: latGrid * gridSize + gridSize / 2,
      lon: lonGrid * gridSize + gridSize / 2,
      count,
    };
  });
}

/**
 * LBS 推荐主函数
 * @param currentLocation 当前用户位置
 * @param allUserLocations 所有用户位置
 * @param options 配置选项
 * @returns 附近用户推荐列表
 */
export function lbsRecommendation(
  currentLocation: Location,
  allUserLocations: UserLocation[],
  options: {
    maxDistance?: number;
    topK?: number;
    excludeUserIds?: Set<number>;
  } = {}
): Array<{
  userId: number;
  distance: number;
  distanceText: string;
  weight: number;
}> {
  const { maxDistance = 20, topK = 20, excludeUserIds = new Set() } = options;

  const nearbyUsers = findNearbyUsers(currentLocation, allUserLocations, {
    maxDistance,
    maxResults: topK,
    excludeUserIds,
  });

  return nearbyUsers;
}
