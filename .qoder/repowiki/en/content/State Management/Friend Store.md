# Friend Store

<cite>
**Referenced Files in This Document**
- [friend.ts](file://src/stores/friend.ts)
- [friend.ts](file://src/api/modules/friend.ts)
- [backend-types.ts](file://src/types/api/backend-types.ts)
- [list.vue](file://src/pages/friend/list.vue)
- [blacklist.vue](file://src/pages/friend/blacklist.vue)
- [following.vue](file://src/pages/friend/following.vue)
- [followers.vue](file://src/pages/friend/followers.vue)
- [privacy.vue](file://src/pages/profile/privacy.vue)
- [profile.ts](file://src/api/profile.ts)
- [useNPS.ts](file://src/composables/useNPS.ts)
- [index.vue](file://src/pages/nearby/index.vue)
- [lbs.ts](file://src/pages/tabbar/home/algorithms/lbs.ts)
</cite>

## Table of Contents
1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [Core Components](#core-components)
4. [Architecture Overview](#architecture-overview)
5. [Detailed Component Analysis](#detailed-component-analysis)
6. [Dependency Analysis](#dependency-analysis)
7. [Performance Considerations](#performance-considerations)
8. [Troubleshooting Guide](#troubleshooting-guide)
9. [Conclusion](#conclusion)
10. [Appendices](#appendices)

## Introduction
This document describes the friend management store and related features in the frontend. It covers the friendship state model (friend lists, following/followers, blocked users), friend actions (follow/unfollow, add friend, delete friend, block/unblock), state synchronization patterns, real-time notification triggers, privacy settings integration, friend discovery mechanisms, and relationship status tracking. It also includes examples of friend search, mutual friend calculation, and friend ranking algorithms, along with performance considerations for large friend networks.

## Project Structure
The friend management functionality spans three layers:
- Store layer: centralized state and actions for friends, following, and blocklist
- API layer: typed HTTP client for friend endpoints
- Pages layer: UI components that consume the store and API

```mermaid
graph TB
subgraph "Store Layer"
FS["Friend Store<br/>src/stores/friend.ts"]
end
subgraph "API Layer"
FA["Friend API<br/>src/api/modules/friend.ts"]
BT["Backend Types<br/>src/types/api/backend-types.ts"]
end
subgraph "Pages Layer"
FL["Friend List Page<br/>src/pages/friend/list.vue"]
BL["Blacklist Page<br/>src/pages/friend/blacklist.vue"]
FW["Following Page<br/>src/pages/friend/following.vue"]
FR["Followers Page<br/>src/pages/friend/followers.vue"]
PR["Privacy Settings<br/>src/pages/profile/privacy.vue"]
PT["Profile API<br/>src/api/profile.ts"]
NB["Nearby Users<br/>src/pages/nearby/index.vue"]
LB["LBS Utilities<br/>src/pages/tabbar/home/algorithms/lbs.ts"]
end
FS --> FA
FA --> BT
FL --> FS
BL --> FS
FW --> FA
FR --> FA
PR --> PT
NB --> LB
```

**Diagram sources**
- [friend.ts:1-70](file://src/stores/friend.ts#L1-L70)
- [friend.ts:1-61](file://src/api/modules/friend.ts#L1-L61)
- [backend-types.ts:292-339](file://src/types/api/backend-types.ts#L292-L339)
- [list.vue:1-184](file://src/pages/friend/list.vue#L1-L184)
- [blacklist.vue:1-261](file://src/pages/friend/blacklist.vue#L1-L261)
- [following.vue:1-160](file://src/pages/friend/following.vue#L1-L160)
- [followers.vue:1-178](file://src/pages/friend/followers.vue#L1-L178)
- [privacy.vue:157-186](file://src/pages/profile/privacy.vue#L157-L186)
- [profile.ts:204-243](file://src/api/profile.ts#L204-L243)
- [index.vue:1-712](file://src/pages/nearby/index.vue#L1-L712)
- [lbs.ts:94-278](file://src/pages/tabbar/home/algorithms/lbs.ts#L94-L278)

**Section sources**
- [friend.ts:1-70](file://src/stores/friend.ts#L1-L70)
- [friend.ts:1-61](file://src/api/modules/friend.ts#L1-L61)
- [backend-types.ts:292-339](file://src/types/api/backend-types.ts#L292-L339)
- [list.vue:1-184](file://src/pages/friend/list.vue#L1-L184)
- [blacklist.vue:1-261](file://src/pages/friend/blacklist.vue#L1-L261)
- [following.vue:1-160](file://src/pages/friend/following.vue#L1-L160)
- [followers.vue:1-178](file://src/pages/friend/followers.vue#L1-L178)
- [privacy.vue:157-186](file://src/pages/profile/privacy.vue#L157-L186)
- [profile.ts:204-243](file://src/api/profile.ts#L204-L243)
- [index.vue:1-712](file://src/pages/nearby/index.vue#L1-L712)
- [lbs.ts:94-278](file://src/pages/tabbar/home/algorithms/lbs.ts#L94-L278)

## Core Components
- Friend Store: exposes reactive friend lists (friends, following, blocklist) and actions to mutate and synchronize state via the API.
- Friend API: typed HTTP client for friend endpoints (list, follow/unfollow, add friend, delete friend, block/unblock, blocklist, status).
- Backend Types: shared types for Friendship, UserBlacklist, and FriendshipStatus used across the store and pages.
- Pages: friend list, blacklist, following, followers, privacy settings, and nearby users.

Key responsibilities:
- State: maintain friendList, followingList, blocklist as reactive arrays.
- Actions: fetch lists, compute friendship status, follow/unfollow, add/delete friend, block/unblock, unlock chat.
- Synchronization: refresh lists after mutations; optimistic updates where appropriate.

**Section sources**
- [friend.ts:7-69](file://src/stores/friend.ts#L7-L69)
- [friend.ts:16-61](file://src/api/modules/friend.ts#L16-L61)
- [backend-types.ts:292-339](file://src/types/api/backend-types.ts#L292-L339)

## Architecture Overview
The friend store integrates with the API layer and UI pages. The store encapsulates state and exposes actions that call the API and update local state. Pages subscribe to store state and trigger actions on user interactions.

```mermaid
sequenceDiagram
participant UI as "UI Page"
participant Store as "Friend Store"
participant API as "Friend API"
participant Types as "Backend Types"
UI->>Store : call action (e.g., follow(userId))
Store->>API : friendApi.follow(userId)
API-->>Store : response (Friendship)
Store->>Store : fetchFollowingList()
Store-->>UI : updated followingList
Note over Store : Optimistic UI updates may occur before refresh
```

**Diagram sources**
- [friend.ts:29-35](file://src/stores/friend.ts#L29-L35)
- [friend.ts:32-36](file://src/api/modules/friend.ts#L32-L36)
- [backend-types.ts:292-319](file://src/types/api/backend-types.ts#L292-L319)

**Section sources**
- [friend.ts:29-35](file://src/stores/friend.ts#L29-L35)
- [friend.ts:32-36](file://src/api/modules/friend.ts#L32-L36)
- [backend-types.ts:292-319](file://src/types/api/backend-types.ts#L292-L319)

## Detailed Component Analysis

### Friend Store State Model
- friendList: array of confirmed friends (Friendship)
- followingList: array of followed users (Friendship)
- blocklist: array of blocked users (UserBlacklist)

Relationships:
- Friendship includes user and friend details, status, mutual flag, and timestamps.
- UserBlacklist includes blocked user info and reason.

```mermaid
classDiagram
class Friendship {
+number id
+number userId
+number friendId
+number status
+number unlockPoints
+number chatCount
+boolean isMutual
+string lastChatAt
+string createdAt
+string updatedAt
+User user
+User friend
}
class UserBlacklist {
+number id
+number userId
+number blockedUserId
+string reason
+string createdAt
+User user
+User blockedUser
}
class FriendStore {
+Friend[] friendList
+Friend[] followingList
+UserBlacklist[] blocklist
+fetchFriendList()
+fetchFollowingList()
+getFriendshipStatus(userId)
+follow(userId)
+unlockChat(userId)
+deleteFriend(userId)
+blockUser(userId, reason?)
+fetchBlocklist()
}
FriendStore --> Friendship : "manages"
FriendStore --> UserBlacklist : "manages"
```

**Diagram sources**
- [backend-types.ts:292-339](file://src/types/api/backend-types.ts#L292-L339)
- [friend.ts:7-69](file://src/stores/friend.ts#L7-L69)

**Section sources**
- [backend-types.ts:292-339](file://src/types/api/backend-types.ts#L292-L339)
- [friend.ts:7-69](file://src/stores/friend.ts#L7-L69)

### Friend Actions and State Synchronization
- Fetch lists: fetchFriendList, fetchFollowingList, fetchBlocklist
- Relationship actions: follow, unfollow, addFriend, deleteFriend, blockUser, unblockUser
- Status checks: getFriendshipStatus
- Real-time triggers: triggerAfterAddFriend after successful follow

```mermaid
sequenceDiagram
participant Page as "Friend List Page"
participant Store as "Friend Store"
participant API as "Friend API"
Page->>Store : getFriendshipStatus(userId)
Store->>API : friendApi.getFriendshipStatus(userId)
API-->>Store : FriendshipStatus
Store-->>Page : status object
Page->>Store : follow(userId)
Store->>API : friendApi.follow(userId)
API-->>Store : success
Store->>Store : fetchFollowingList()
Store-->>Page : updated followingList
```

**Diagram sources**
- [list.vue:59-109](file://src/pages/friend/list.vue#L59-L109)
- [friend.ts:22-35](file://src/stores/friend.ts#L22-L35)
- [friend.ts:32-48](file://src/api/modules/friend.ts#L32-L48)

**Section sources**
- [list.vue:59-109](file://src/pages/friend/list.vue#L59-L109)
- [friend.ts:22-35](file://src/stores/friend.ts#L22-L35)
- [friend.ts:32-48](file://src/api/modules/friend.ts#L32-L48)

### Blacklist Management
- Load blocklist via API and store
- Unblocking updates both API and store state

```mermaid
sequenceDiagram
participant BL as "Blacklist Page"
participant API as "Friend API"
participant Store as "Friend Store"
BL->>API : getBlocklist()
API-->>BL : UserBlacklist[]
BL->>Store : fetchBlocklist()
Store-->>BL : blocklist updated
BL->>API : unblockUser(blockedUserId)
API-->>BL : success
BL->>Store : fetchBlocklist()
Store-->>BL : blocklist refreshed
```

**Diagram sources**
- [blacklist.vue:52-103](file://src/pages/friend/blacklist.vue#L52-L103)
- [friend.ts:59-60](file://src/api/modules/friend.ts#L59-L60)
- [friend.ts:51-54](file://src/stores/friend.ts#L51-L54)

**Section sources**
- [blacklist.vue:52-103](file://src/pages/friend/blacklist.vue#L52-L103)
- [friend.ts:59-60](file://src/api/modules/friend.ts#L59-L60)
- [friend.ts:51-54](file://src/stores/friend.ts#L51-L54)

### Following and Followers
- Following page supports viewing self or another user’s following list and unfollowing
- Followers page supports viewing self or another user’s followers and following/unfollowing with optimistic UI updates

```mermaid
flowchart TD
Start(["User opens Followers/Following"]) --> Load["Load list via friendApi"]
Load --> CheckSelf{"Is self profile?"}
CheckSelf --> |Yes| Self["Use getFollowersList/getFollowingList"]
CheckSelf --> |No| Other["Use getUserFollowersList/getUserFollowingList(userId)"]
Self --> Render["Render list"]
Other --> Render
Render --> Action{"User clicks Follow/Unfollow"}
Action --> |Follow| APIFollow["friendApi.follow(userId)"]
Action --> |Unfollow| APIUnfollow["friendApi.unfollow(userId)"]
APIFollow --> Refresh["Reload list"]
APIUnfollow --> Refresh
Refresh --> End(["UI updated"])
```

**Diagram sources**
- [following.vue:41-99](file://src/pages/friend/following.vue#L41-L99)
- [followers.vue:37-117](file://src/pages/friend/followers.vue#L37-L117)
- [friend.ts:20-36](file://src/api/modules/friend.ts#L20-L36)

**Section sources**
- [following.vue:41-99](file://src/pages/friend/following.vue#L41-L99)
- [followers.vue:37-117](file://src/pages/friend/followers.vue#L37-L117)
- [friend.ts:20-36](file://src/api/modules/friend.ts#L20-L36)

### Privacy Settings Integration
- Privacy settings include toggles for allowing search, recommendation, stranger messages, and requiring certification
- These settings influence discoverability and interaction permissions

```mermaid
graph LR
PS["Privacy Settings Page<br/>privacy.vue"] --> PRF["Profile API<br/>profile.ts"]
PRF --> PRIV["PrivacySettings DTO"]
PRIV --> DISC["Discovery & Permissions"]
```

**Diagram sources**
- [privacy.vue:157-186](file://src/pages/profile/privacy.vue#L157-L186)
- [profile.ts:204-243](file://src/api/profile.ts#L204-L243)

**Section sources**
- [privacy.vue:157-186](file://src/pages/profile/privacy.vue#L157-L186)
- [profile.ts:204-243](file://src/api/profile.ts#L204-L243)

### Friend Discovery Mechanisms
- Nearby users discovery: location-based user finding with distance and gender filters
- LBS utilities support grid-based fast neighbor lookup

```mermaid
sequenceDiagram
participant NB as "Nearby Page"
participant LOC as "Location API"
participant LBS as "LBS Utils"
participant UI as "UI"
NB->>LOC : updateLocation({lat, lng})
LOC-->>NB : ok
NB->>LBS : findNearbyUsers(...)
LBS-->>NB : nearby users
NB->>UI : render list
```

**Diagram sources**
- [index.vue:214-244](file://src/pages/nearby/index.vue#L214-L244)
- [lbs.ts:94-278](file://src/pages/tabbar/home/algorithms/lbs.ts#L94-L278)

**Section sources**
- [index.vue:214-244](file://src/pages/nearby/index.vue#L214-L244)
- [lbs.ts:94-278](file://src/pages/tabbar/home/algorithms/lbs.ts#L94-L278)

### Relationship Status Tracking
- getFriendshipStatus returns:
  - isFriend, isFollowing, canAddFriend
  - chatCount vs requiredChatCount
  - currentPoints vs requiredPoints
  - status enum

```mermaid
flowchart TD
A["Call getFriendshipStatus(userId)"] --> B{"Can chat?"}
B --> |No| C{"Is following?"}
C --> |No| D["Prompt to follow"]
C --> |Yes| E{"Chat count < required?"}
E --> |Yes| F["Show chat count message"]
E --> |No| G{"Points < required?"}
G --> |Yes| H["Show points insufficient"]
G --> |No| I["Unlock chat"]
B --> |Yes| I
```

**Diagram sources**
- [list.vue:59-109](file://src/pages/friend/list.vue#L59-L109)
- [friend.ts:4-14](file://src/api/modules/friend.ts#L4-L14)

**Section sources**
- [list.vue:59-109](file://src/pages/friend/list.vue#L59-L109)
- [friend.ts:4-14](file://src/api/modules/friend.ts#L4-L14)

### Examples

#### Friend Search Functionality
- Not implemented in the store or pages; however, privacy settings allow/disallow being found by others. Integration would require adding a search endpoint and UI.

#### Mutual Friend Calculation
- Given two users’ friend lists, mutual friends are the intersection of their friend arrays. This can be computed client-side by comparing friendId sets.

```mermaid
flowchart TD
Start(["Given two friend lists"]) --> A["Convert to sets of friendId"]
A --> B["Compute intersection"]
B --> C["Return mutual friend ids"]
C --> End(["Done"])
```

[No sources needed since this diagram shows conceptual workflow, not actual code structure]

#### Friend Ranking Algorithms
- Ranking by mutual connections and engagement is supported conceptually; the codebase includes a hot ranking algorithm suitable for content but not directly for friend ranking. A friend-specific ranking could combine:
  - Number of mutual friends
  - Engagement metrics (posts, likes, comments)
  - Recency of interaction
  - Privacy settings compatibility (visible, searchable)

```mermaid
flowchart TD
S(["Collect user profiles and interactions"]) --> M["Compute mutual friends per user"]
M --> E["Aggregate engagement scores"]
E --> R["Apply recency weighting"]
R --> W["Apply privacy compatibility weights"]
W --> O(["Rank users descending by score"])
```

[No sources needed since this diagram shows conceptual workflow, not actual code structure]

## Dependency Analysis
- Store depends on API module for network calls and on backend types for typing.
- Pages depend on the store for state and on API for direct calls where needed.
- Privacy settings integrate with profile API to enforce discoverability and interaction policies.

```mermaid
graph LR
Store["Friend Store"] --> API["Friend API"]
Store --> Types["Backend Types"]
FL["Friend List Page"] --> Store
BL["Blacklist Page"] --> Store
FW["Following Page"] --> API
FR["Followers Page"] --> API
PR["Privacy Settings"] --> ProfileAPI["Profile API"]
```

**Diagram sources**
- [friend.ts:1-70](file://src/stores/friend.ts#L1-L70)
- [friend.ts:1-61](file://src/api/modules/friend.ts#L1-L61)
- [backend-types.ts:292-339](file://src/types/api/backend-types.ts#L292-L339)
- [list.vue:1-184](file://src/pages/friend/list.vue#L1-L184)
- [blacklist.vue:1-261](file://src/pages/friend/blacklist.vue#L1-L261)
- [following.vue:1-160](file://src/pages/friend/following.vue#L1-L160)
- [followers.vue:1-178](file://src/pages/friend/followers.vue#L1-L178)
- [privacy.vue:157-186](file://src/pages/profile/privacy.vue#L157-L186)
- [profile.ts:204-243](file://src/api/profile.ts#L204-L243)

**Section sources**
- [friend.ts:1-70](file://src/stores/friend.ts#L1-L70)
- [friend.ts:1-61](file://src/api/modules/friend.ts#L1-L61)
- [backend-types.ts:292-339](file://src/types/api/backend-types.ts#L292-L339)
- [list.vue:1-184](file://src/pages/friend/list.vue#L1-L184)
- [blacklist.vue:1-261](file://src/pages/friend/blacklist.vue#L1-L261)
- [following.vue:1-160](file://src/pages/friend/following.vue#L1-L160)
- [followers.vue:1-178](file://src/pages/friend/followers.vue#L1-L178)
- [privacy.vue:157-186](file://src/pages/profile/privacy.vue#L157-L186)
- [profile.ts:204-243](file://src/api/profile.ts#L204-L243)

## Performance Considerations
- Prefer optimistic UI updates for follow/unfollow to reduce perceived latency; rollback on failure.
- Batch refreshes: after block/unblock, refresh blocklist; after follow, refresh following list.
- Pagination and virtualization for large lists (followers/following).
- Debounce or throttle frequent status checks (getFriendshipStatus) to avoid excessive network calls.
- Use grid-based spatial indexing for nearby users to limit candidate sets before distance computation.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
Common issues and remedies:
- Follow fails: verify network connectivity and handle error messages; revert optimistic state if unfollow succeeds.
- Chat unlock conditions: present clear messages for chat count and points requirements.
- Blocklist not updating: ensure fetchBlocklist is called after unblock; check API response.
- Privacy settings not taking effect: confirm profile API updates and re-fetch privacy settings.

**Section sources**
- [list.vue:59-109](file://src/pages/friend/list.vue#L59-L109)
- [blacklist.vue:76-102](file://src/pages/friend/blacklist.vue#L76-L102)
- [followers.vue:95-116](file://src/pages/friend/followers.vue#L95-L116)

## Conclusion
The friend store provides a clean separation of concerns between state, API, and UI. It supports essential friend actions, maintains synchronized lists, and integrates with privacy controls and discovery features. Extending the system with friend search, mutual friend computation, and friend ranking can leverage existing privacy and LBS utilities while maintaining performance through optimistic updates and efficient data structures.

## Appendices

### API Definitions Summary
- Friend endpoints: list, following, followers, follow, unfollow, request, accept, add-friend, status, delete, block, unblock, blocklist
- Types: Friendship, UserBlacklist, FriendshipStatus

**Section sources**
- [friend.ts:16-61](file://src/api/modules/friend.ts#L16-L61)
- [backend-types.ts:292-339](file://src/types/api/backend-types.ts#L292-L339)