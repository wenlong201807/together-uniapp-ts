import { defineStore } from 'pinia';
import { ref } from 'vue';
import { squareApi } from '@/api';
import type { Post, Comment } from '@/types';
import type {
  CreatePostDto,
  CreateCommentDto,
  LikeDto,
  ReportDto,
} from '@/api/modules/square';

export const useSquareStore = defineStore('square', () => {
  const posts = ref<Post[]>([]);
  const currentPost = ref<Post | null>(null);
  const comments = ref<Comment[]>([]);
  const hasMore = ref(true);
  const loading = ref(false);

  const fetchPosts = async (params?: any) => {
    if (loading.value) return;

    loading.value = true;
    try {
      const res = await squareApi.getPosts(params);
      if (params?.page === 1) {
        posts.value = res.data.list;
      } else {
        posts.value.push(...res.data.list);
      }
      hasMore.value = res.data.list.length >= (params?.pageSize || 20);
    } finally {
      loading.value = false;
    }
  };

  const fetchPost = async (id: number) => {
    const res = await squareApi.getPost(id);
    currentPost.value = res.data;
  };

  const createPost = async (data: CreatePostDto) => {
    await squareApi.createPost(data);
    await fetchPosts({ page: 1 });
  };

  const deletePost = async (id: number) => {
    await squareApi.deletePost(id);
    posts.value = posts.value.filter((p) => p.id !== id);
  };

  const fetchComments = async (
    postId: number,
    params?: { page?: number; pageSize?: number; sort?: 'time' | 'hot' },
  ) => {
    const res = await squareApi.getComments(postId, params);
    comments.value = res.data.list;
  };

  const createComment = async (data: CreateCommentDto) => {
    await squareApi.createComment(data);
    await fetchComments(data.postId);
    
    // 更新当前帖子的评论数
    if (currentPost.value && currentPost.value.id === data.postId) {
      currentPost.value.commentCount = (currentPost.value.commentCount || 0) + 1;
    }
    // 更新帖子列表中的评论数
    const post = posts.value.find((p) => p.id === data.postId);
    if (post) {
      post.commentCount = (post.commentCount || 0) + 1;
    }
  };

  const toggleLike = async (data: LikeDto) => {
    await squareApi.toggleLike(data);

    if (data.targetType === 1) {
      const post = posts.value.find((p) => p.id === data.targetId);
      if (post) {
        post.isLiked = !post.isLiked;
        post.likeCount += post.isLiked ? 1 : -1;
      }
    }
  };

  const report = async (data: ReportDto) => {
    await squareApi.report(data);
  };

  return {
    posts,
    currentPost,
    comments,
    hasMore,
    loading,
    fetchPosts,
    fetchPost,
    createPost,
    deletePost,
    fetchComments,
    createComment,
    toggleLike,
    report,
  };
});
