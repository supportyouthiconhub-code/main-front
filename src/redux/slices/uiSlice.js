import { createSlice } from '@reduxjs/toolkit';

const slice = createSlice({
  name: 'ui',
  initialState: { cartOpen: false, mobileMenu: false },
  reducers: {
    openCart:        (s) => { s.cartOpen   = true;  },
    closeCart:       (s) => { s.cartOpen   = false; },
    toggleCart:      (s) => { s.cartOpen   = !s.cartOpen; },
    openMobileMenu:  (s) => { s.mobileMenu = true;  },
    closeMobileMenu: (s) => { s.mobileMenu = false; },
  },
});

export const { openCart, closeCart, toggleCart, openMobileMenu, closeMobileMenu } = slice.actions;
export default slice.reducer;
