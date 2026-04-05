import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { productAPI, categoryAPI } from '../../services/api';

export const fetchProducts  = createAsyncThunk('products/all',      async (p, {rejectWithValue}) => { try{return await productAPI.getAll(p);}catch(e){return rejectWithValue(e.message);} });
export const fetchFeatured  = createAsyncThunk('products/featured', async (_,{rejectWithValue})  => { try{return await productAPI.getFeatured();}catch(e){return rejectWithValue(e.message);} });
export const fetchProduct   = createAsyncThunk('products/one',      async (slug,{rejectWithValue})=>{ try{return await productAPI.getBySlug(slug);}catch(e){return rejectWithValue(e.message);} });
export const fetchCategories= createAsyncThunk('products/cats',     async (_,{rejectWithValue})  => { try{return await categoryAPI.getTree();}catch(e){return rejectWithValue(e.message);} });

const slice = createSlice({
  name: 'products',
  initialState: {
    items:[], featured:[], current:null, categories:[],
    pagination:null, loading:false, featuredLoading:false, error:null,
    filters:{ category:'', minPrice:'', maxPrice:'', sort:'newest', search:'' },
  },
  reducers: {
    setFilters(s,a){ s.filters = {...s.filters,...a.payload}; },
    resetFilters(s){ s.filters = { category:'', minPrice:'', maxPrice:'', sort:'newest', search:'' }; },
    clearCurrent(s){ s.current = null; },
  },
  extraReducers:(b)=>{
    b.addCase(fetchProducts.pending,  (s)=>{ s.loading=true; s.error=null; })
     .addCase(fetchProducts.fulfilled,(s,a)=>{ s.loading=false; s.items=a.payload.data; s.pagination=a.payload.pagination; })
     .addCase(fetchProducts.rejected, (s,a)=>{ s.loading=false; s.error=a.payload; });

    b.addCase(fetchFeatured.pending,  (s)=>{ s.featuredLoading=true; })
     .addCase(fetchFeatured.fulfilled,(s,a)=>{ s.featuredLoading=false; s.featured=a.payload.data; })
     .addCase(fetchFeatured.rejected, (s)=>{ s.featuredLoading=false; });

    b.addCase(fetchProduct.pending,   (s)=>{ s.loading=true; s.current=null; s.error=null; })
     .addCase(fetchProduct.fulfilled, (s,a)=>{ s.loading=false; s.current=a.payload.data; })
     .addCase(fetchProduct.rejected,  (s,a)=>{ s.loading=false; s.error=a.payload; });

    b.addCase(fetchCategories.fulfilled,(s,a)=>{ s.categories=a.payload.data; });
  },
});

export const { setFilters, resetFilters, clearCurrent } = slice.actions;
export default slice.reducer;
