import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { settingsAPI } from '../../services/api';

export const fetchPublicSettings = createAsyncThunk('settings/fetchPublic',
  async (_, { rejectWithValue }) => {
    try { return await settingsAPI.getPublic(); }
    catch (e) { return rejectWithValue(e.message); }
  }
);

const DEFAULTS = {
  store_name:  'Youth Icon Hub',
  store_email: 'support@youthfashionhouse.com',
  store_phone: '+91 9876543210',
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    store_name:  DEFAULTS.store_name,
    store_email: DEFAULTS.store_email,
    store_phone: DEFAULTS.store_phone,
    success_page: {},
    failure_page: {},
    loaded: false,
  },
  reducers: {
    // Allow admin settings page to update the store immediately after saving
    updateSettings(state, { payload }) {
      Object.assign(state, payload);
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchPublicSettings.fulfilled, (state, { payload }) => {
      const d = payload?.data || {};
      if (d.store_name)  state.store_name  = d.store_name;
      if (d.store_email) state.store_email = d.store_email;
      if (d.store_phone) state.store_phone = d.store_phone;
      if (d.success_page) state.success_page = d.success_page;
      if (d.failure_page) state.failure_page = d.failure_page;
      state.loaded = true;
    });
  },
});

export const { updateSettings } = settingsSlice.actions;
export default settingsSlice.reducer;
