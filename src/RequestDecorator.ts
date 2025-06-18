"use strict"

export { RequestDecorator }

// https://github.com/chenjigeng/requestDecorator/blob/master/src/RequestDecorator.js

// 修改版：创建3个睡眠promise，最多2个并发数，实现至多耗时200毫秒：
// const delayMs = (ms) => new Promise(resolve => setTimeout(resolve, ms))
// let decorator = new RequestDecorator(delayMs, 2)
// let promises = [decorator.request(100), decorator.request(100), decorator.request(100)]
// Promise.allSettled(promises).then(() => {console.log('ok')})

interface RequestDecoratorParam {
  requestApi: any
  maxLimit: number
}

type PromiseResolveCallback = <T>(value: T | PromiseLike<T>) => void

class RequestDecorator implements RequestDecoratorParam {
  requestApi: any
  maxLimit: number
  requestQueue: PromiseResolveCallback[]
  currentConcurrent: number

  constructor(maxLimit: number, requestApi: any) {
    this.maxLimit = maxLimit
    this.requestQueue = []
    this.currentConcurrent = 0
    this.requestApi = requestApi
  }

  async request(...args: any[]) {
    if (this.currentConcurrent >= this.maxLimit) {
      await this.startBlocking()
    }

    try {
      this.currentConcurrent++
      const result = await this.requestApi(...args)
      return Promise.resolve(result)
    } catch (err) {
      return Promise.reject(err)
    } finally {
      this.currentConcurrent--
      this.next()
    }
  }

  startBlocking() {
    let _resolve: PromiseResolveCallback
    let promise2 = new Promise((resolve, reject) => _resolve = resolve)
    this.requestQueue.push(_resolve!)
    return promise2
  }

  next() {
    if (this.requestQueue.length <= 0) return
    const _resolve = this.requestQueue.shift()
    if (_resolve)
      _resolve(undefined)
  }
}
