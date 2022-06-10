import { useQueue, genAsyncFn } from './queue'
import { IRequestOptions, validate } from './options'
import { getDefaultOptions } from './options'
import type { RequestFn, RequestConfig } from './type'

export async function useRequest<T = RequestConfig | RequestFn>(
  requestArr: T[],
  options?: IRequestOptions,
): Promise<any[]> {
  const config = Object.create(null)
  Object.assign(config, getDefaultOptions(), options ?? {})

  validate(config)

  const reqQueue = useQueue()
  const formattedReqArr = formatRuqestArr(requestArr)

  if (options?.type === 'parallel') {
    await reqQueue.parallelRun(formattedReqArr)
  } else {
    reqQueue.add(formattedReqArr.map(item => genAsyncFn(item, config)))
    await reqQueue.run()
  }

  return reqQueue.result
}

export function formatRuqestArr(requestArr): RequestConfig[] {
  if (!Array.isArray(requestArr)) {
    return []
  }

  let formattedReqArr = requestArr.map(requestItem => {
    if (typeof requestItem === 'function') {
      const req: RequestConfig = {
        name: requestItem.name,
        request: requestItem as unknown as RequestFn,
        retryTimes: (requestItem as unknown as RequestFn)?.retryTimes ?? 0,
      }

      return req
    }

    return requestItem
  })

  return formattedReqArr
}
