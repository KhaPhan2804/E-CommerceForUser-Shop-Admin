import { createSlice } from '@reduxjs/toolkit'



const initialState = {
    items: [],
}

export const cartSlices = createSlice({
    name: 'cart',
    initialState,
    reducers: {
        addToCart: (state, action) => {
            const existItem = state.items.find(item => item.id === action.payload.id);
            if(existItem){
                existItem.quantity += action.payload.quantity;
            }
            else{
                state.items.push({ ...action.payload, quantity: action.payload.quantity ?? 1 });
            }
        },

        removeFromCart: (state, action) => {
            state.items = state.items.filter(item => item.id !== action.payload.id);
        },

        updateQuantity: (state,action) => {
            const {id, quantity} = action.payload;
            const item = state.items.find(item => item.id === id);
            if (item && quantity > 0) {
                item.quantity = quantity;
            }
        },

        clearCart: (state, action) => {
            state.items = [];
        },
        clearSelectedItems: (state, action) => {
            const selectedIds = action.payload;  
            state.items = state.items.filter(item => !selectedIds.includes(item.id));  
        },
    }
});

export const {addToCart, removeFromCart, updateQuantity, clearCart, clearSelectedItems} = cartSlices.actions;

export const selectCartItems = (state) => state.cart.items;

export const selectCartTotal = state => state.cart.items.reduce((total, item) => total + item.price * item.quantity, 0);


export default cartSlices.reducer;