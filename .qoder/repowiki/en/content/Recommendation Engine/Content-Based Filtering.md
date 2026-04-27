# Content-Based Filtering

<cite>
**Referenced Files in This Document**
- [contentBased.ts](file://src/pages/tabbar/home/algorithms/contentBased.ts)
- [mixStrategy.ts](file://src/pages/tabbar/home/algorithms/mixStrategy.ts)
- [collaborative.ts](file://src/pages/tabbar/home/algorithms/collaborative.ts)
- [hotRanking.ts](file://src/pages/tabbar/home/algorithms/hotRanking.ts)
- [lbs.ts](file://src/pages/tabbar/home/algorithms/lbs.ts)
- [home.vue](file://src/pages/tabbar/home.vue)
- [useRecommendation.ts](file://src/pages/tabbar/home/composables/useRecommendation.ts)
- [recommendation.ts](file://src/pages/tabbar/home/types/recommendation.ts)
- [home.ts](file://src/api/home.ts)
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
This document explains the content-based filtering recommendation algorithm implemented in the project. It covers how user preferences and content attributes are modeled, how features are extracted and represented, and how similarity is computed to produce recommendations. It also documents TF-IDF weighting, vector-space modeling, cosine similarity, and practical techniques such as preference learning, content feature engineering, and recommendation scoring. Finally, it addresses advantages like interpretability and cold-start handling, along with strategies for managing content drift and maintaining recommendation freshness.

## Project Structure
The content-based filtering implementation resides under the home recommendation algorithms module. It integrates with other recommendation strategies (collaborative filtering, hot ranking, LBS) via a hybrid strategy and is consumed by the home page UI and composables.

```mermaid
graph TB
subgraph "Home Page"
HV["home.vue"]
end
subgraph "Algorithms"
CBF["contentBased.ts<br/>Content-based filtering"]
COL["collaborative.ts<br/>Collaborative filtering"]
HOT["hotRanking.ts<br/>Hot ranking"]
LBS["lbs.ts<br/>Location-based services"]
MIX["mixStrategy.ts<br/>Hybrid strategy"]
end
subgraph "Composables & Types"
UR["useRecommendation.ts"]
RT["recommendation.ts"]
end
subgraph "API Layer"
API["home.ts"]
end
HV --> UR
UR --> MIX
MIX --> CBF
MIX --> COL
MIX --> HOT
MIX --> LBS
UR --> API
UR --> RT
```

**Diagram sources**
- [home.vue:129-438](file://src/pages/tabbar/home.vue#L129-L438)
- [useRecommendation.ts:14-201](file://src/pages/tabbar/home/composables/useRecommendation.ts#L14-L201)
- [mixStrategy.ts:363-387](file://src/pages/tabbar/home/algorithms/mixStrategy.ts#L363-L387)
- [contentBased.ts:259-296](file://src/pages/tabbar/home/algorithms/contentBased.ts#L259-L296)
- [collaborative.ts:170-222](file://src/pages/tabbar/home/algorithms/collaborative.ts#L170-L222)
- [hotRanking.ts:290-329](file://src/pages/tabbar/home/algorithms/hotRanking.ts#L290-L329)
- [lbs.ts:357-381](file://src/pages/tabbar/home/algorithms/lbs.ts#L357-L381)
- [home.ts:68-134](file://src/api/home.ts#L68-L134)

**Section sources**
- [contentBased.ts:1-296](file://src/pages/tabbar/home/algorithms/contentBased.ts#L1-L296)
- [mixStrategy.ts:1-387](file://src/pages/tabbar/home/algorithms/mixStrategy.ts#L1-L387)
- [collaborative.ts:1-222](file://src/pages/tabbar/home/algorithms/collaborative.ts#L1-L222)
- [hotRanking.ts:1-329](file://src/pages/tabbar/home/algorithms/hotRanking.ts#L1-L329)
- [lbs.ts:1-381](file://src/pages/tabbar/home/algorithms/lbs.ts#L1-L381)
- [home.vue:129-438](file://src/pages/tabbar/home.vue#L129-L438)
- [useRecommendation.ts:14-201](file://src/pages/tabbar/home/composables/useRecommendation.ts#L14-L201)
- [recommendation.ts:1-119](file://src/pages/tabbar/home/types/recommendation.ts#L1-L119)
- [home.ts:68-134](file://src/api/home.ts#L68-L134)

## Core Components
- UserInterest and ContentItem models define preference and content attribute representations.
- Matching function computes a similarity score based on shared weighted tags.
- TF-IDF extractor builds keyword importance scores for textual content.
- Diversity adjustment improves recommendation variety.
- Cold-start fallback uses popularity scores for new users.
- Hybrid strategy orchestrates multiple algorithms and merges results.

**Section sources**
- [contentBased.ts:6-26](file://src/pages/tabbar/home/algorithms/contentBased.ts#L6-L26)
- [contentBased.ts:34-70](file://src/pages/tabbar/home/algorithms/contentBased.ts#L34-L70)
- [contentBased.ts:79-95](file://src/pages/tabbar/home/algorithms/contentBased.ts#L79-L95)
- [contentBased.ts:104-130](file://src/pages/tabbar/home/algorithms/contentBased.ts#L104-L130)
- [contentBased.ts:171-226](file://src/pages/tabbar/home/algorithms/contentBased.ts#L171-L226)
- [contentBased.ts:235-250](file://src/pages/tabbar/home/algorithms/contentBased.ts#L235-L250)
- [contentBased.ts:259-296](file://src/pages/tabbar/home/algorithms/contentBased.ts#L259-L296)

## Architecture Overview
The hybrid recommendation pipeline composes content-based, collaborative, hot-ranking, and LBS strategies. The home page uses a composable to fetch and render mixed recommendations, optionally falling back to mock data.

```mermaid
sequenceDiagram
participant UI as "home.vue"
participant UR as "useRecommendation.ts"
participant MIX as "mixStrategy.ts"
participant CBF as "contentBased.ts"
participant COL as "collaborative.ts"
participant HOT as "hotRanking.ts"
participant LBS as "lbs.ts"
UI->>UR : fetchRecommendations()
UR->>MIX : hybridRecommendation(context, dataSource, config)
MIX->>CBF : contentBasedFiltering(userInterest, contents, options)
MIX->>COL : collaborativeFiltering(userId, behaviors, topK)
MIX->>HOT : hotRanking(interactions, options)
MIX->>LBS : lbsRecommendation(userLocation, locations, options)
MIX-->>UR : merged recommendations
UR-->>UI : render mixed feed
```

**Diagram sources**
- [home.vue:164-178](file://src/pages/tabbar/home.vue#L164-L178)
- [useRecommendation.ts:32-82](file://src/pages/tabbar/home/composables/useRecommendation.ts#L32-L82)
- [mixStrategy.ts:363-387](file://src/pages/tabbar/home/algorithms/mixStrategy.ts#L363-L387)
- [contentBased.ts:259-296](file://src/pages/tabbar/home/algorithms/contentBased.ts#L259-L296)
- [collaborative.ts:170-222](file://src/pages/tabbar/home/algorithms/collaborative.ts#L170-L222)
- [hotRanking.ts:290-329](file://src/pages/tabbar/home/algorithms/hotRanking.ts#L290-L329)
- [lbs.ts:357-381](file://src/pages/tabbar/home/algorithms/lbs.ts#L357-L381)

## Detailed Component Analysis

### Content-Based Filtering Core
- UserInterest: maps user ID to a set of tags with weights (1–5).
- ContentItem: identifies content by ID/type and carries tags with weights plus optional metadata.
- Matching: computes a normalized score by multiplying matching user and content tag weights, then dividing by the maximum possible score for matched tags.
- TF-IDF: computes term frequency and inverse document frequency to score keywords in textual content.
- Keyword extraction: tokenizes text, computes TF-IDF per unique term, and returns top-K terms.
- Diversity adjustment: greedily selects items to maximize both score and tag variety.
- Cold-start: falls back to popularity scores when user interest is missing.
- Main function: orchestrates filtering, diversity tuning, and top-K selection.

```mermaid
flowchart TD
Start(["Start contentBasedFiltering"]) --> CheckUser["User interest provided?"]
CheckUser --> |No| ColdStart["coldStartRecommendation()<br/>rank by popularity"]
CheckUser --> |Yes| CBRec["contentBasedRecommendation()<br/>match user vs candidates"]
CBRec --> Diversity["applyDiversityAdjustment()<br/>greedy selection with tag bonus"]
ColdStart --> ReturnTop["Slice to topK"]
Diversity --> ReturnTop
ReturnTop --> End(["End"])
```

**Diagram sources**
- [contentBased.ts:259-296](file://src/pages/tabbar/home/algorithms/contentBased.ts#L259-L296)
- [contentBased.ts:140-163](file://src/pages/tabbar/home/algorithms/contentBased.ts#L140-L163)
- [contentBased.ts:171-226](file://src/pages/tabbar/home/algorithms/contentBased.ts#L171-L226)
- [contentBased.ts:235-250](file://src/pages/tabbar/home/algorithms/contentBased.ts#L235-L250)

**Section sources**
- [contentBased.ts:6-26](file://src/pages/tabbar/home/algorithms/contentBased.ts#L6-L26)
- [contentBased.ts:34-70](file://src/pages/tabbar/home/algorithms/contentBased.ts#L34-L70)
- [contentBased.ts:79-95](file://src/pages/tabbar/home/algorithms/contentBased.ts#L79-L95)
- [contentBased.ts:104-130](file://src/pages/tabbar/home/algorithms/contentBased.ts#L104-L130)
- [contentBased.ts:171-226](file://src/pages/tabbar/home/algorithms/contentBased.ts#L171-L226)
- [contentBased.ts:235-250](file://src/pages/tabbar/home/algorithms/contentBased.ts#L235-L250)
- [contentBased.ts:259-296](file://src/pages/tabbar/home/algorithms/contentBased.ts#L259-L296)

### Feature Extraction and Representation
- Tag-based model: both users and items are represented as sets of weighted tags. This enables fast matching and interpretable feature engineering.
- Text-based model: TF-IDF extracts keywords from textual content. Tokenization is basic; in production, integrate a robust tokenizer and stopword removal.
- Vector space model: while explicit vectors are not constructed here, the tag-matching formulation mirrors a sparse vector dot product with normalization.

```mermaid
flowchart TD
A["Raw content text"] --> B["Tokenize<br/>lowercase + remove punctuation"]
B --> C["Compute TF per term"]
B --> D["Collect all documents"]
D --> E["Compute IDF per term"]
C --> F["TF-IDF = TF * IDF"]
E --> F
F --> G["Sort by score desc"]
G --> H["Select top-K keywords"]
```

**Diagram sources**
- [contentBased.ts:104-130](file://src/pages/tabbar/home/algorithms/contentBased.ts#L104-L130)
- [contentBased.ts:79-95](file://src/pages/tabbar/home/algorithms/contentBased.ts#L79-L95)

**Section sources**
- [contentBased.ts:104-130](file://src/pages/tabbar/home/algorithms/contentBased.ts#L104-L130)
- [contentBased.ts:79-95](file://src/pages/tabbar/home/algorithms/contentBased.ts#L79-L95)

### Preference Learning and Scoring
- Preference learning: user interest tags are collected and stored via API endpoints. These tags drive the matching function.
- Scoring: the matching score is the sum of products of aligned user and content tag weights, normalized by the maximum possible score for matched tags. Diversity adjustment further refines the final ranking.

```mermaid
flowchart TD
U["User tags {tag, weight}"] --> M["Map to lowercase keys"]
C["Content tags {tag, weight}"] --> S["Sum userWeight * contentWeight<br/>for each match"]
S --> N["Normalize by maxPossible = 25 * matchedTags"]
N --> D["Add diversity bonus per new unmatched tags"]
D --> R["Final score for content"]
```

**Diagram sources**
- [contentBased.ts:34-70](file://src/pages/tabbar/home/algorithms/contentBased.ts#L34-L70)
- [contentBased.ts:171-226](file://src/pages/tabbar/home/algorithms/contentBased.ts#L171-L226)

**Section sources**
- [contentBased.ts:34-70](file://src/pages/tabbar/home/algorithms/contentBased.ts#L34-L70)
- [contentBased.ts:171-226](file://src/pages/tabbar/home/algorithms/contentBased.ts#L171-L226)
- [home.ts:119-134](file://src/api/home.ts#L119-L134)

### Similarity and Vector Space Concepts
- Cosine similarity: implemented in collaborative filtering for user vectors. While content-based filtering here uses tag matching, cosine similarity is a standard technique for vector-space models.
- TF-IDF and cosine similarity: TF-IDF weights can be assembled into term vectors; cosine similarity then measures angular distance between vectors.

```mermaid
flowchart TD
V1["Vector A"] --> DP["Dot Product"]
V2["Vector B"] --> DP
DP --> N1["Norm A"]
V1 --> N1
DP --> N2["Norm B"]
V2 --> N2
N1 --> CS["Cosine = Dot/(NormA * NormB)"]
N2 --> CS
```

**Diagram sources**
- [collaborative.ts:59-79](file://src/pages/tabbar/home/algorithms/collaborative.ts#L59-L79)

**Section sources**
- [collaborative.ts:59-79](file://src/pages/tabbar/home/algorithms/collaborative.ts#L59-L79)

### Cold Start and Freshness Management
- Cold start: when user interest is absent, recommendations fall back to popularity scores and are sorted to present diverse yet popular content.
- Freshness: hot ranking applies time decay and Wilson score to keep recommendations timely and quality-aware. Hybrid strategy ensures periodic updates and variety.

```mermaid
flowchart TD
CS0["No user interest?"] --> |Yes| Pop["Rank by popularity scores"]
CS0 --> |No| Match["Match user tags to content"]
Pop --> Out["Return topK"]
Match --> Div["Apply diversity adjustment"]
Div --> Out
```

**Diagram sources**
- [contentBased.ts:276-279](file://src/pages/tabbar/home/algorithms/contentBased.ts#L276-L279)
- [contentBased.ts:235-250](file://src/pages/tabbar/home/algorithms/contentBased.ts#L235-L250)
- [contentBased.ts:259-296](file://src/pages/tabbar/home/algorithms/contentBased.ts#L259-L296)

**Section sources**
- [contentBased.ts:235-250](file://src/pages/tabbar/home/algorithms/contentBased.ts#L235-L250)
- [contentBased.ts:259-296](file://src/pages/tabbar/home/algorithms/contentBased.ts#L259-L296)
- [hotRanking.ts:80-135](file://src/pages/tabbar/home/algorithms/hotRanking.ts#L80-L135)

### Integration in the Home Page
- The home page uses a composable to fetch mixed recommendations, supports pagination and refresh, and renders different card types (personalized, hot, nearby, topic, new).
- The composable can use real APIs or mock data, and exposes a trackAction method for user behavior reporting.

```mermaid
sequenceDiagram
participant HV as "home.vue"
participant UR as "useRecommendation.ts"
participant API as "home.ts"
HV->>UR : fetchRecommendations()
UR->>API : getRecommendationFeed()
API-->>UR : RecommendationFeedResponse
UR-->>HV : Mixed recommendation items
HV->>UR : trackAction(action, targetType, targetId)
UR->>API : trackUserAction()
```

**Diagram sources**
- [home.vue:164-178](file://src/pages/tabbar/home.vue#L164-L178)
- [useRecommendation.ts:32-82](file://src/pages/tabbar/home/composables/useRecommendation.ts#L32-L82)
- [home.ts:68-104](file://src/api/home.ts#L68-L104)

**Section sources**
- [home.vue:129-438](file://src/pages/tabbar/home.vue#L129-L438)
- [useRecommendation.ts:14-201](file://src/pages/tabbar/home/composables/useRecommendation.ts#L14-L201)
- [home.ts:68-104](file://src/api/home.ts#L68-L104)

## Dependency Analysis
- contentBased.ts depends on:
  - Its own internal helpers (matching, TF-IDF, keyword extraction, diversity, cold-start).
  - Hybrid strategy (mixStrategy.ts) for orchestration and integration with other algorithms.
- mixStrategy.ts depends on:
  - contentBased.ts for personalized recommendations.
  - collaborative.ts for collaborative recommendations.
  - hotRanking.ts for hot content.
  - lbs.ts for nearby users.
- home.vue and useRecommendation.ts depend on:
  - mixStrategy.ts for recommendation generation.
  - home.ts for API calls and data types.

```mermaid
graph LR
CBF["contentBased.ts"] --> MIX["mixStrategy.ts"]
COL["collaborative.ts"] --> MIX
HOT["hotRanking.ts"] --> MIX
LBS["lbs.ts"] --> MIX
MIX --> UR["useRecommendation.ts"]
UR --> HV["home.vue"]
UR --> API["home.ts"]
UR --> RT["recommendation.ts"]
```

**Diagram sources**
- [mixStrategy.ts:363-387](file://src/pages/tabbar/home/algorithms/mixStrategy.ts#L363-L387)
- [contentBased.ts:259-296](file://src/pages/tabbar/home/algorithms/contentBased.ts#L259-L296)
- [collaborative.ts:170-222](file://src/pages/tabbar/home/algorithms/collaborative.ts#L170-L222)
- [hotRanking.ts:290-329](file://src/pages/tabbar/home/algorithms/hotRanking.ts#L290-L329)
- [lbs.ts:357-381](file://src/pages/tabbar/home/algorithms/lbs.ts#L357-L381)
- [useRecommendation.ts:14-201](file://src/pages/tabbar/home/composables/useRecommendation.ts#L14-L201)
- [home.vue:129-438](file://src/pages/tabbar/home.vue#L129-L438)
- [home.ts:68-134](file://src/api/home.ts#L68-L134)
- [recommendation.ts:1-119](file://src/pages/tabbar/home/types/recommendation.ts#L1-L119)

**Section sources**
- [mixStrategy.ts:363-387](file://src/pages/tabbar/home/algorithms/mixStrategy.ts#L363-L387)
- [contentBased.ts:259-296](file://src/pages/tabbar/home/algorithms/contentBased.ts#L259-L296)
- [collaborative.ts:170-222](file://src/pages/tabbar/home/algorithms/collaborative.ts#L170-L222)
- [hotRanking.ts:290-329](file://src/pages/tabbar/home/algorithms/hotRanking.ts#L290-L329)
- [lbs.ts:357-381](file://src/pages/tabbar/home/algorithms/lbs.ts#L357-L381)
- [useRecommendation.ts:14-201](file://src/pages/tabbar/home/composables/useRecommendation.ts#L14-L201)
- [home.vue:129-438](file://src/pages/tabbar/home.vue#L129-L438)
- [home.ts:68-134](file://src/api/home.ts#L68-L134)
- [recommendation.ts:1-119](file://src/pages/tabbar/home/types/recommendation.ts#L1-L119)

## Performance Considerations
- Matching complexity: for each candidate, iterate over its tags and check against user tag map; overall O(C × T) where C is candidates and T is average tags per candidate.
- Diversity adjustment: greedy selection with tag set maintenance; worst-case O(R^2) depending on remaining list size.
- Keyword extraction: TF-IDF per unique term; complexity proportional to total tokens across documents.
- Recommendations: sorting dominates; typical O(N log N) for top-K selection after scoring.
- Practical tips:
  - Precompute user tag map once per request.
  - Cache popularity scores and pre-filter candidates by coarse filters (e.g., categories).
  - Use efficient data structures (Maps/Sets) for tag lookups and diversity tracking.
  - Batch API calls and leverage caching for hot content and banners.

[No sources needed since this section provides general guidance]

## Troubleshooting Guide
- No recommendations returned:
  - Verify user interest exists and contains tags; otherwise cold-start fallback applies.
  - Ensure candidate contents have non-empty tags.
- Low diversity:
  - Increase diversity factor to encourage varied tags.
- Slow performance:
  - Reduce topK multiplier during initial scoring.
  - Pre-filter candidates by coarse criteria (e.g., type, category).
- Incorrect scoring:
  - Confirm tag normalization and matching logic.
  - Validate TF-IDF tokenization and stopword handling.

**Section sources**
- [contentBased.ts:276-279](file://src/pages/tabbar/home/algorithms/contentBased.ts#L276-L279)
- [contentBased.ts:171-226](file://src/pages/tabbar/home/algorithms/contentBased.ts#L171-L226)
- [contentBased.ts:104-130](file://src/pages/tabbar/home/algorithms/contentBased.ts#L104-L130)

## Conclusion
The content-based filtering implementation provides a clear, interpretable foundation for recommendations by aligning user interests with content attributes via weighted tags. It integrates seamlessly with a hybrid strategy that combines collaborative filtering, hot ranking, and LBS to deliver diverse, timely, and relevant recommendations. Robust feature extraction (TF-IDF), diversity adjustments, and cold-start handling ensure strong user experiences, while modular design and performance-conscious patterns support scalability.

[No sources needed since this section summarizes without analyzing specific files]

## Appendices

### Example Workflows

#### Content-Based Matching Workflow
```mermaid
sequenceDiagram
participant U as "UserInterest"
participant C as "ContentItem"
participant F as "calculateContentMatch()"
U->>F : tags with weights
C->>F : tags with weights
F-->>U : normalized similarity score
```

**Diagram sources**
- [contentBased.ts:34-70](file://src/pages/tabbar/home/algorithms/contentBased.ts#L34-L70)

#### TF-IDF Keyword Extraction
```mermaid
sequenceDiagram
participant T as "extractKeywords()"
participant TF as "calculateTFIDF()"
T->>T : tokenize(text)
T->>TF : compute TF-IDF per unique term
TF-->>T : score per term
T-->>T : sort and select top-K
```

**Diagram sources**
- [contentBased.ts:104-130](file://src/pages/tabbar/home/algorithms/contentBased.ts#L104-L130)
- [contentBased.ts:79-95](file://src/pages/tabbar/home/algorithms/contentBased.ts#L79-L95)

### Data Models Overview
```mermaid
classDiagram
class UserInterest {
+number userId
+tags : Array<tag, weight>
}
class ContentItem {
+number id
+string type
+tags : Array<tag, weight>
+metadata : title, description, category
}
UserInterest --> ContentItem : "matching score"
```

**Diagram sources**
- [contentBased.ts:6-26](file://src/pages/tabbar/home/algorithms/contentBased.ts#L6-L26)