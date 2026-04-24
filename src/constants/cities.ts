/**
 * 城市数据常量
 */

/**
 * 城市信息
 */
export interface City {
  code: string;
  name: string;
  pinyin: string;
  initial: string;
}

/**
 * 省份信息
 */
export interface Province {
  code: string;
  name: string;
  cities: City[];
}

/**
 * 热门城市列表
 */
export const HOT_CITIES: City[] = [
  { code: '110000', name: '北京', pinyin: 'beijing', initial: 'B' },
  { code: '310000', name: '上海', pinyin: 'shanghai', initial: 'S' },
  { code: '440100', name: '广州', pinyin: 'guangzhou', initial: 'G' },
  { code: '440300', name: '深圳', pinyin: 'shenzhen', initial: 'S' },
  { code: '330100', name: '杭州', pinyin: 'hangzhou', initial: 'H' },
  { code: '320100', name: '南京', pinyin: 'nanjing', initial: 'N' },
  { code: '510100', name: '成都', pinyin: 'chengdu', initial: 'C' },
  { code: '420100', name: '武汉', pinyin: 'wuhan', initial: 'W' },
  { code: '610100', name: '西安', pinyin: 'xian', initial: 'X' },
  { code: '500000', name: '重庆', pinyin: 'chongqing', initial: 'C' },
  { code: '120000', name: '天津', pinyin: 'tianjin', initial: 'T' },
  { code: '350200', name: '厦门', pinyin: 'xiamen', initial: 'X' },
];

/**
 * 所有城市列表（按首字母分组）
 */
export const ALL_CITIES: Record<string, City[]> = {
  A: [
    { code: '340100', name: '合肥', pinyin: 'hefei', initial: 'A' },
    { code: '230100', name: '哈尔滨', pinyin: 'haerbin', initial: 'A' },
  ],
  B: [
    { code: '110000', name: '北京', pinyin: 'beijing', initial: 'B' },
  ],
  C: [
    { code: '510100', name: '成都', pinyin: 'chengdu', initial: 'C' },
    { code: '500000', name: '重庆', pinyin: 'chongqing', initial: 'C' },
    { code: '430100', name: '长沙', pinyin: 'changsha', initial: 'C' },
    { code: '220100', name: '长春', pinyin: 'changchun', initial: 'C' },
  ],
  D: [
    { code: '210200', name: '大连', pinyin: 'dalian', initial: 'D' },
    { code: '530100', name: '昆明', pinyin: 'kunming', initial: 'D' },
  ],
  F: [
    { code: '350100', name: '福州', pinyin: 'fuzhou', initial: 'F' },
  ],
  G: [
    { code: '440100', name: '广州', pinyin: 'guangzhou', initial: 'G' },
    { code: '520100', name: '贵阳', pinyin: 'guiyang', initial: 'G' },
  ],
  H: [
    { code: '330100', name: '杭州', pinyin: 'hangzhou', initial: 'H' },
    { code: '230100', name: '哈尔滨', pinyin: 'haerbin', initial: 'H' },
    { code: '340100', name: '合肥', pinyin: 'hefei', initial: 'H' },
    { code: '460100', name: '海口', pinyin: 'haikou', initial: 'H' },
  ],
  J: [
    { code: '320100', name: '南京', pinyin: 'nanjing', initial: 'J' },
  ],
  K: [
    { code: '530100', name: '昆明', pinyin: 'kunming', initial: 'K' },
  ],
  L: [
    { code: '620100', name: '兰州', pinyin: 'lanzhou', initial: 'L' },
  ],
  N: [
    { code: '320100', name: '南京', pinyin: 'nanjing', initial: 'N' },
    { code: '450100', name: '南宁', pinyin: 'nanning', initial: 'N' },
    { code: '330200', name: '宁波', pinyin: 'ningbo', initial: 'N' },
  ],
  Q: [
    { code: '370200', name: '青岛', pinyin: 'qingdao', initial: 'Q' },
  ],
  S: [
    { code: '310000', name: '上海', pinyin: 'shanghai', initial: 'S' },
    { code: '440300', name: '深圳', pinyin: 'shenzhen', initial: 'S' },
    { code: '320500', name: '苏州', pinyin: 'suzhou', initial: 'S' },
    { code: '210100', name: '沈阳', pinyin: 'shenyang', initial: 'S' },
    { code: '140100', name: '太原', pinyin: 'taiyuan', initial: 'S' },
    { code: '370100', name: '济南', pinyin: 'jinan', initial: 'S' },
  ],
  T: [
    { code: '120000', name: '天津', pinyin: 'tianjin', initial: 'T' },
    { code: '140100', name: '太原', pinyin: 'taiyuan', initial: 'T' },
  ],
  W: [
    { code: '420100', name: '武汉', pinyin: 'wuhan', initial: 'W' },
    { code: '320200', name: '无锡', pinyin: 'wuxi', initial: 'W' },
  ],
  X: [
    { code: '610100', name: '西安', pinyin: 'xian', initial: 'X' },
    { code: '350200', name: '厦门', pinyin: 'xiamen', initial: 'X' },
    { code: '630100', name: '西宁', pinyin: 'xining', initial: 'X' },
  ],
  Y: [
    { code: '640100', name: '银川', pinyin: 'yinchuan', initial: 'Y' },
  ],
  Z: [
    { code: '330100', name: '杭州', pinyin: 'hangzhou', initial: 'Z' },
    { code: '370100', name: '济南', pinyin: 'jinan', initial: 'Z' },
    { code: '370200', name: '青岛', pinyin: 'qingdao', initial: 'Z' },
    { code: '370300', name: '淄博', pinyin: 'zibo', initial: 'Z' },
    { code: '441900', name: '东莞', pinyin: 'dongguan', initial: 'Z' },
    { code: '440400', name: '珠海', pinyin: 'zhuhai', initial: 'Z' },
    { code: '330300', name: '温州', pinyin: 'wenzhou', initial: 'Z' },
    { code: '370600', name: '烟台', pinyin: 'yantai', initial: 'Z' },
    { code: '321100', name: '镇江', pinyin: 'zhenjiang', initial: 'Z' },
  ],
};

/**
 * 获取所有首字母
 */
export const CITY_INITIALS = Object.keys(ALL_CITIES).sort();

/**
 * 搜索城市
 */
export function searchCities(keyword: string): City[] {
  if (!keyword) return [];

  const lowerKeyword = keyword.toLowerCase();
  const results: City[] = [];

  // 搜索热门城市
  HOT_CITIES.forEach(city => {
    if (
      city.name.includes(keyword) ||
      city.pinyin.includes(lowerKeyword) ||
      city.initial.toLowerCase() === lowerKeyword
    ) {
      results.push(city);
    }
  });

  // 搜索所有城市
  Object.values(ALL_CITIES).forEach(cities => {
    cities.forEach(city => {
      if (
        !results.find(c => c.code === city.code) &&
        (city.name.includes(keyword) ||
          city.pinyin.includes(lowerKeyword) ||
          city.initial.toLowerCase() === lowerKeyword)
      ) {
        results.push(city);
      }
    });
  });

  return results;
}

/**
 * 根据城市代码获取城市名称
 */
export function getCityNameByCode(code: string): string {
  const hotCity = HOT_CITIES.find(c => c.code === code);
  if (hotCity) return hotCity.name;

  for (const cities of Object.values(ALL_CITIES)) {
    const city = cities.find(c => c.code === code);
    if (city) return city.name;
  }

  return '未知城市';
}
