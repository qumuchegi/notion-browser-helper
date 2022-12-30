/**
 * 1. 串行执行 promise
 */
export const serialExcutePromises = async <T>(
  promiseLoaders: (() => Promise<T>)[]
) => {
  let rs: T[] = []
  for (let pl of promiseLoaders) {
    rs.push(await pl())
  }
  return rs
}

/**
 * 2. 动态串行执行 promise
 * 比第 1 种特殊的情况： 中间有新的 promise 加入
 */

class DynamicSerialExcutePromise<P extends () => Promise<any>> {
  private preExcutionPromise: Promise<any>
  public serialExcute = async (promiseLoader: P) => {
    await this.preExcutionPromise
    this.preExcutionPromise = promiseLoader()
    return this.preExcutionPromise
  }
}

const dynamicQueueExcuteSyncBookmarkPromises = new DynamicSerialExcutePromise()
export const queueExcuteSyncBookmarkPromises = (
  syncBookmarkPromiseLoader: () => Promise<any>
) => {
  return dynamicQueueExcuteSyncBookmarkPromises.serialExcute(
    syncBookmarkPromiseLoader
  )
}
