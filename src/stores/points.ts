import { defineStore } from 'pinia'
import { ref } from 'vue'
import { pointsApi, type PointsBalance, type SignStatus, type SignResult, type PointsLog } from '@/api/modules/points'

export const usePointsStore = defineStore(
  'points',
  () => {
    const balance = ref<PointsBalance>({ balance: 0, totalEarned: 0, totalConsumed: 0 })
    const signStatus = ref<SignStatus>({ signedToday: false, continuousDays: 0 })
    const logs = ref<PointsLog[]>([])
    const totalLogs = ref(0)

    const fetchBalance = async () => {
      try {
        const res = await pointsApi.getBalance()
        balance.value = res.data
      } catch (error) {
        console.error('Failed to fetch balance:', error)
      }
    }

    const fetchSignStatus = async () => {
      try {
        const res = await pointsApi.getSignStatus()
        signStatus.value = res.data
      } catch (error) {
        console.error('Failed to fetch sign status:', error)
      }
    }

    const sign = async (): Promise<SignResult | null> => {
      try {
        const res = await pointsApi.sign()
        await fetchBalance()
        await fetchSignStatus()
        return res.data
      } catch (error) {
        console.error('Failed to sign:', error)
        return null
      }
    }

    const fetchLogs = async (page = 1, pageSize = 20, type?: number) => {
      try {
        const res = await pointsApi.getLogs(page, pageSize, type)
        logs.value = res.data.list
        totalLogs.value = res.data.total
      } catch (error) {
        console.error('Failed to fetch logs:', error)
      }
    }

    return {
      balance,
      signStatus,
      logs,
      totalLogs,
      fetchBalance,
      fetchSignStatus,
      sign,
      fetchLogs
    }
  }
)
