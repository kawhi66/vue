import RenderStream from './render-stream'
import { createRenderFunction } from './render'
import { warn } from 'core/util/debug'

export const MAX_STACK_DEPTH = 1000

export function createRenderer ({
  modules = [],
  directives = {},
  isUnaryTag = (() => false)
} = {}) {
  if (process.env.VUE_ENV !== 'server') {
    warn(
      'You are using createRenderer without setting VUE_ENV enviroment variable to "server". ' +
      'It is recommended to set VUE_ENV=server this will help rendering performance, ' +
      'by turning data observation off.'
    )
  }
  const render = createRenderFunction(modules, directives, isUnaryTag)
  return {
    renderToString (component, done) {
      let result = ''
      let stackDepth = 0
      render(component, (str, next) => {
        result += str
        if (next) {
          if (stackDepth >= MAX_STACK_DEPTH) {
            process.nextTick(next)
          } else {
            stackDepth++
            next()
            stackDepth--
          }
        } else {
          done(result)
        }
      })
    },
    renderToStream (component) {
      return new RenderStream((write, done) => {
        render(component, write, done)
      })
    }
  }
}