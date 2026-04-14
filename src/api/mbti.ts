import request from './request';

export interface MbtiQuestion {
  id: number;
  dimension: string;
  direction: number;
  content: string;
  optionA: string;
  optionB: string;
}

export interface MbtiAnswer {
  questionId: number;
  answerValue: number;
}

export interface MbtiResult {
  id: number;
  userId: number;
  mbtiType: string;
  eiScore: number;
  snScore: number;
  tfScore: number;
  jpScore: number;
  sessionId: string;
  isCurrent: boolean;
  createdAt: string;
}

export interface MbtiReport {
  mbtiType: string;
  typeName: string;
  description: string;
  characteristics: string[];
  strengths: string[];
  weaknesses: string[];
  careers: string[];
  relationships: string;
  compatibility: {
    best: string[];
    good: string[];
    challenging: string[];
  };
  avatarUrl: string;
  themeColor: string;
}

export const mbtiApi = {
  // 开始新测试
  startTest() {
    return request.post<{ sessionId: string; questions: MbtiQuestion[] }>('/mbti/start');
  },

  // 提交单个答案
  submitAnswer(data: { sessionId: string; questionId: number; answerValue: number }) {
    return request.post('/mbti/answer', data);
  },

  // 提交测试
  submitTest(data: { sessionId: string }) {
    return request.post<MbtiResult>('/mbti/submit', data);
  },

  // 获取测试报告
  getReport(mbtiType: string) {
    return request.get<MbtiReport>('/mbti/report', { mbtiType });
  },

  // 获取当前测试结果
  getCurrentResult() {
    return request.get<MbtiResult>('/mbti/current');
  },

  // 获取测试历史
  getHistory() {
    return request.get<MbtiResult[]>('/mbti/history');
  },
};
