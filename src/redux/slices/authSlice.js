import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../services/api';

const TOKEN_KEY = 'se_token';

/* ── Thunks ────────────────────────────────────────────── */
export const adminLogin = createAsyncThunk('auth/adminLogin',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await authAPI.adminLogin(email, password);
      localStorage.setItem(TOKEN_KEY, res.token);
      return res;
    } catch (e) { return rejectWithValue(e.message); }
  }
);

export const sendOTP = createAsyncThunk('auth/sendOTP',
  async (phone, { rejectWithValue }) => {
    try { return await authAPI.sendOTP(phone); }
    catch (e) { return rejectWithValue(e.message); }
  }
);

export const verifyOTP = createAsyncThunk('auth/verifyOTP',
  async ({ phone, otp ,reqId}, { rejectWithValue }) => {
    // NOTE: we do NOT pass localCart here anymore.
    // Cart merge is handled separately after login via /cart/sync.
    try {
      const res = await authAPI.verifyOTP({ phone, otp, reqId });
      // const res = await authAPI.verifyOTP({ phone, otp });
      localStorage.setItem(TOKEN_KEY, res.token);
      return res;
    } catch (e) { return rejectWithValue(e.message); }
  }
);

export const fetchMe = createAsyncThunk('auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try { return await authAPI.getMe(); }
    catch (e) { return rejectWithValue(e.message); }
  }
);

export const updateProfile = createAsyncThunk('auth/updateProfile',
  async (data, { rejectWithValue }) => {
    try { return await authAPI.updateProfile(data); }
    catch (e) { return rejectWithValue(e.message); }
  }
);

export const addAddress = createAsyncThunk('auth/addAddress',
  async (data, { rejectWithValue }) => {
    try { return await authAPI.addAddress(data); }
    catch (e) { return rejectWithValue(e.message); }
  }
);

export const updateAddress = createAsyncThunk(
  'auth/updateAddress',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      return await authAPI.updateAddress(id, data);
    } catch (e) {
      return rejectWithValue(e.message);
    }
  }
);

export const saveAndSelectAddress = createAsyncThunk('auth/saveAndSelectAddress',
  async (addressData, { rejectWithValue }) => {
    try { return await authAPI.addAddress(addressData); }
    catch (e) { return rejectWithValue(e.message); }
  }
);

/* ── Slice ─────────────────────────────────────────────── */
const LOCAL_CART_KEY = 'se_cart';

const slice = createSlice({
  name: 'auth',
  initialState: {
    user:         null,
    token:        localStorage.getItem(TOKEN_KEY) || null,
    loading:      false,
    otpSent:      false,
    error:        null,
     reqId: null,  
    // initialized = true means we have attempted to restore the session.
    // Start as true if there is NO saved token (no need to fetchMe).
    // Start as false if there IS a token (we need to verify it first).
    initialized: !localStorage.getItem(TOKEN_KEY),
  },
  reducers: {
    logout(state) {
      state.user        = null;
      state.token       = null;
      state.otpSent     = false;
      state.initialized = true;
      localStorage.removeItem(TOKEN_KEY);
      // Also wipe guest cart so it doesn't bleed into next session
      localStorage.removeItem(LOCAL_CART_KEY);
    },
    clearError(state) { state.error = null; },
    clearOtp(state)   { state.otpSent = false; state.error = null; },
  },
  extraReducers: (b) => {
    const pend = (s)    => { s.loading = true;  s.error = null; };
    const fail = (s, a) => { s.loading = false; s.error = a.payload; };
    b.addCase(updateAddress.fulfilled, (s, a) => {
  if (s.user) s.user.addresses = a.payload.addresses;
});

    /* adminLogin — sets initialized so guards unblock immediately */
    b.addCase(adminLogin.pending, pend)
     .addCase(adminLogin.fulfilled, (s, a) => {
       s.loading     = false;
       s.user        = a.payload.user;
       s.token       = a.payload.token;
       s.initialized = true;
     })
     .addCase(adminLogin.rejected, fail);

    /* sendOTP */
    b.addCase(sendOTP.pending, pend)
     .addCase(sendOTP.fulfilled, (s,a) => { s.loading = false; s.otpSent = true;   s.reqId = a.payload.reqId; })
     .addCase(sendOTP.rejected, fail);

    /* verifyOTP — sets initialized so Private guard unblocks immediately */
    b.addCase(verifyOTP.pending, pend)
     .addCase(verifyOTP.fulfilled, (s, a) => {
       s.loading     = false;
       s.user        = a.payload.user;
       s.token       = a.payload.token;
       s.otpSent     = false;
       s.initialized = true;  // ← KEY FIX: guard unblocks right away
     })
     .addCase(verifyOTP.rejected, fail);

    /* fetchMe — restores session on page refresh */
    b.addCase(fetchMe.pending, (s) => { s.loading = true; })
     .addCase(fetchMe.fulfilled, (s, a) => {
       s.loading     = false;
       s.user        = a.payload.user;
       s.initialized = true;
     })
     .addCase(fetchMe.rejected, (s) => {
       // Token was invalid — wipe it
       s.loading     = false;
       s.token       = null;
       s.initialized = true;
       localStorage.removeItem(TOKEN_KEY);
       localStorage.removeItem(LOCAL_CART_KEY);
     });

    /* updateProfile */
    b.addCase(updateProfile.fulfilled, (s, a) => { s.user = a.payload.user; });

    /* addAddress */
    b.addCase(addAddress.fulfilled, (s, a) => {
      if (s.user) s.user.addresses = a.payload.addresses;
    });

    /* saveAndSelectAddress — same as addAddress, updates addresses list in store */
    b.addCase(saveAndSelectAddress.fulfilled, (s, a) => {
      if (s.user) s.user.addresses = a.payload.addresses;
    });
  },
});

export const { logout, clearError, clearOtp } = slice.actions;
export default slice.reducer;

