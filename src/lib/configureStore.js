/* eslint-disable global-require */
/* eslint-disable no-undef */
import { createStore, applyMiddleware } from 'redux'
import rootReducer from './rootReducer'
import thunk from 'redux-thunk'
import createLogger from 'redux-logger'

let middleware = [thunk]

// if (__DEV__) {
   // const createLogger = require('redux-logger')
const logger = createLogger({ collapsed: true, level: 'info' })
middleware = [...middleware, logger]
// } else {
  // middleware = [...middleware]
// }

export default function configureStore (initialState) {
  return createStore(
    rootReducer,
    initialState,  
    //window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__(),     
    applyMiddleware(...middleware),    
  )
}
