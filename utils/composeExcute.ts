/**
 * 1. 批量执行
 */
class BatchExcute {
  private excutionIdMap = new Map<string, () => any>()
  private batchWinTime: number
  constructor({ batchWinTime }: { batchWinTime: number }) {
    this.batchWinTime = batchWinTime
  }
  // 假设 batchWinTime 是 5000，
  // 那么 5 秒内, 同一个 id 只执行第一个，但是在 5 秒之后执行
  public batchExcute = (id: string, callback: () => any) => {
    const maybePendingExcution = this.excutionIdMap.get(id)
    if (!!maybePendingExcution) {
    } else {
      this.excutionIdMap.set(id, callback)
      setTimeout(() => {
        callback()
        this.excutionIdMap.delete(id)
      }, this.batchWinTime)
    }
  }
}

const BATCH_WIN_SIZE = 1000 * 5 // 5 秒
export const batchExcuteSyncBookmark = new BatchExcute({
  batchWinTime: BATCH_WIN_SIZE
}).batchExcute
