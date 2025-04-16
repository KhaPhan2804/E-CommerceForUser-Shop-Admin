import { configureStore } from '@reduxjs/toolkit'
import  productSlices  from './app/slices/productSlices'
import  cartSlices  from './app/slices/cartSlices'
import authSlices from './app/slices/authSlices'
import categoryReducer from './app/slices/categorySlices'


export const store = configureStore({
  reducer: {
    product: productSlices,
    cart: cartSlices,
    auth: authSlices,
    category: categoryReducer,
  },
})