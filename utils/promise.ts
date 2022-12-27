export const serialExcutePromises = async (
  promiseLoaders: (() => Promise<any>)[]
) => {
  let rs = []
  for (let pl of promiseLoaders) {
    rs.push(await pl())
  }
  return rs
}
