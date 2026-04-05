import { configureStore } from '@reduxjs/toolkit';
import authReducer     from './slices/authSlice';
import cartReducer     from './slices/cartSlice';
import productReducer  from './slices/productSlice';
import uiReducer       from './slices/uiSlice';
import settingsReducer from './slices/settingsSlice';

export const store = configureStore({
  reducer: {
    auth:     authReducer,
    cart:     cartReducer,
    products: productReducer,
    ui:       uiReducer,
    settings: settingsReducer,
  },
  middleware: (getDefault) => getDefault({ serializableCheck: false }),
});
