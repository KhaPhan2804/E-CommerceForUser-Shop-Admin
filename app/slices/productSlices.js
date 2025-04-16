import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    product:null
};
export const productSlices = createSlice({
  name: 'product',
  initialState,
  reducers:{
    setProduct: (state, action) => {
       state.product = action.payload;
    },
  }
});

export const {setProduct} = productSlices.actions;

export const selectProduct = (state) => state.product.product;

export default productSlices.reducer;