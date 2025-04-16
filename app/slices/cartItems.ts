export interface CartItem {
    id: string | number;
    name: string;
    price: number;
    quantity: number;
}
export interface RootState{
    cart: {
        items: CartItem[];
    };
}
export default RootState;