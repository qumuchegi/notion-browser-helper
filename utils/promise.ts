export const serialExcutePromises = async <T>(
  promiseLoaders: (() => Promise<T>)[]
) => {
  let rs: T[] = []
  for (let pl of promiseLoaders) {
    rs.push(await pl())
  }
  return rs
}
