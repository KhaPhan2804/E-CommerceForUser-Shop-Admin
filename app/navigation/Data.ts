export type ParamList = {
    Main: undefined,
    Cart: undefined,
    Delivery:undefined,
    Shop:undefined,
    ChatTotal: undefined,
    ChatBox: {
        room_id: number;
        MaKH: number;
    },
    Chat:{
        shop_id: number;
        room_id: number;
    },
    Response:{
        shop_id: number;
    }
    ResponseBox:{
        shop_id: number;
        room_id: number;
    }
    PaymentCancel:{
        order_id: string[];
    },
    AfterOrder:{
        MaKH: number,
    },
    Pending:{
        MaKH: number,
    },
    History:{
        MaKH: number,
    },
    AcceptPending:{
        idShop:number;
    },
    FullPackage:{
        idShop:number;
    },
    RatingTotal:{
        idShop:number;
    },
    Supplying:{
        idShop:number;
    },
    Cancel:{
        idShop:number;
    },
    Ship:{
        MaKH: number,
    },
    Supply:{
        MaKH: number,
    },
    Rating:{
        MaKH: number,
    },
    ShopSetting: {
        idShop:number;
    },
    ShopInterface: {
        idShop:number;
    },
    SearchUser: undefined,
    AddProduct: {
        idShop: number;
    },
    ShippingFee: {
        productId: number;
        weight: number;
        shippingMethod: string;
    },
    ProductSetting: {
        productId: number;
        idShop: number;
    },
    CategorySetting: {
        categoryName: number;
        productId: number;
    },
    ShopProduct: {
        idShop: number;
    },
    SearchProduct:{
        searchTerm: string;
    },
    SearchShopProduct:{
        searchTerm: string;
        idShop: number;
    },
    PriceStock:{
        productId: number;
    },
    Order: {
        selectedData: {
            name: string;
            price: number; 
            image: string;
            quantity: number;
            productId: number;
            shopId: number;
        }[];
        totalCost: number;
        maKH: string;
        address: string;
    },
    Admin: undefined,
    Purchase:{
        id: number;
        name: string;
        price: number;
        quantity: number;
        image: string;
    },
    Login: undefined,
    Register: undefined,
    Profile: undefined,
    Upload: undefined,
    Edit: {
        name: string;
        email: string;
        avatar: string;
        phone: string;
        address: string;
        password: string;
    },
    Category: {
        categoryId: string ;
        categoryName: string;
    },
    Product:{
        id:  number;
    },
    SearchShop:{
        idShop: number;
    },
    ShopSale:{
        idShop: number;
    },
    Payment:{
        totalCost: number;
        maKH: string;
        orders: {
            productId: number;
            quantity: number;
            order_id: string;
        }[];
    },
    AdminProductDetail:{
        id: number;
    }
    AdminUserDetail:{
        userId: string;
    }
};
export default ParamList;