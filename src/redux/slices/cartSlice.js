import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { cartAPI } from '../../services/api';

const KEY       = 'se_cart';
const loadLocal  = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
const saveLocal  = (items) => localStorage.setItem(KEY, JSON.stringify(items));
const wipeLocal  = () => localStorage.removeItem(KEY);

/* ── Thunks ────────────────────────────────────────────── */
export const fetchCart    = createAsyncThunk('cart/fetch',
  async (_, { rejectWithValue }) => {
    try { return await cartAPI.get(); } catch (e) { return rejectWithValue(e.message); }
  }
);

export const addToCartDB  = createAsyncThunk('cart/add',
  async (data, { rejectWithValue }) => {
    try { return await cartAPI.add(data); } catch (e) { return rejectWithValue(e.message); }
  }
);

export const updateItemDB = createAsyncThunk('cart/update',
  async ({ id, qty }, { rejectWithValue }) => {
    try { return await cartAPI.updateItem(id, qty); } catch (e) { return rejectWithValue(e.message); }
  }
);

export const removeItemDB = createAsyncThunk('cart/remove',
  async (id, { rejectWithValue }) => {
    try { return await cartAPI.removeItem(id); } catch (e) { return rejectWithValue(e.message); }
  }
);

/**
 * Called right after login.
 * Sends localItems to server for merging, then clears local storage.
 * If localItems is empty, just fetches the existing DB cart.
 */
export const syncCartAfterLogin = createAsyncThunk('cart/syncAfterLogin',
  async (_, { getState, rejectWithValue }) => {
    try {
      const localItems = getState().cart.localItems;
      if (localItems.length > 0) {
        return await cartAPI.sync(localItems);
      }
      return await cartAPI.get();
    } catch (e) { return rejectWithValue(e.message); }
  }
);

/* ── Helpers ───────────────────────────────────────────── */
const setLoading = (s)    => { s.loading = true;  s.error = null; };
const setError   = (s, a) => { s.loading = false; s.error = a.payload; };

const applyCart = (state, action) => {
  const d           = action.payload?.data || {};
  state.items           = d.items           || [];
  state.subtotal        = d.subtotal        || 0;
  state.shippingCharges = d.shippingCharges || 0;
  state.total           = d.total           || 0;
  // Always compute itemCount from items array — never trust a potentially stale server value
  state.itemCount       = state.items.reduce((sum, i) => sum + (i.quantity || 0), 0);
  state.loading         = false;
};

/* ── Slice ─────────────────────────────────────────────── */
const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    /* DB cart (logged-in users) */
    items:           [],
    subtotal:        0,
    shippingCharges: 0,
    total:           0,
    itemCount:       0,
    /* Guest cart (localStorage) */
    localItems:      loadLocal(),
    loading:         false,
    error:           null,
  },
  reducers: {
    /* Guest cart mutations */
    addLocal(state, { payload: p }) {
      const idx = state.localItems.findIndex(
        x => x.productId === p.productId && String(x.variantId) === String(p.variantId)
      );
      if (idx > -1) state.localItems[idx].quantity += (p.quantity || 1);
      else          state.localItems.push({ ...p, quantity: p.quantity || 1 });
      saveLocal(state.localItems);
    },

    updateLocal(state, { payload: { productId, variantId, quantity } }) {
      const idx = state.localItems.findIndex(
        x => x.productId === productId && String(x.variantId) === String(variantId)
      );
      if (idx > -1) {
        if (quantity <= 0) state.localItems.splice(idx, 1);
        else               state.localItems[idx].quantity = quantity;
        saveLocal(state.localItems);
      }
    },

    removeLocal(state, { payload: { productId, variantId } }) {
      state.localItems = state.localItems.filter(
        x => !(x.productId === productId && String(x.variantId) === String(variantId))
      );
      saveLocal(state.localItems);
    },

    /**
     * Called on logout — wipe BOTH DB cart state AND local cart.
     * This ensures Cart A doesn't bleed into session B.
     */
    wipeCart(state) {
      state.items           = [];
      state.localItems      = [];
      state.subtotal        = 0;
      state.shippingCharges = 0;
      state.total           = 0;
      state.itemCount       = 0;
      wipeLocal();
    },

    /* Called after payment success */
    clearAll(state) {
      state.items           = [];
      state.localItems      = [];
      state.subtotal        = 0;
      state.shippingCharges = 0;
      state.total           = 0;
      state.itemCount       = 0;
      wipeLocal();
    },
  },

  extraReducers: (b) => {
    /* fetchCart, addToCartDB, updateItemDB, removeItemDB */
    [fetchCart, addToCartDB, updateItemDB, removeItemDB].forEach(thunk => {
      b.addCase(thunk.pending,   setLoading)
       .addCase(thunk.fulfilled, applyCart)
       .addCase(thunk.rejected,  setError);
    });

    /* syncCartAfterLogin — apply DB cart AND clear local */
    b.addCase(syncCartAfterLogin.pending,   setLoading)
     .addCase(syncCartAfterLogin.fulfilled, (state, action) => {
       applyCart(state, action);
       state.localItems = [];
       wipeLocal();
     })
     .addCase(syncCartAfterLogin.rejected,  setError);
  },
});

export const { addLocal, updateLocal, removeLocal, wipeCart, clearAll } = cartSlice.actions;
export default cartSlice.reducer;

/* ── Selector ──────────────────────────────────────────── */
export const selectCartCount = (state) => {
  if (state.auth.token) {
    // Always compute from the items array — never trust the stale itemCount field
    const items = state.cart.items || [];
    if (items.length > 0) return items.reduce((sum, i) => sum + (i.quantity || 0), 0);
    // Fall back to itemCount if items haven't loaded yet (e.g. still syncing)
    return state.cart.itemCount || 0;
  }
  return (state.cart.localItems || []).reduce((sum, i) => sum + (i.quantity || 0), 0);
};
