import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { setCredentials, logOut } from '../../features/auth/authSlice';

const baseQuery = fetchBaseQuery({
	baseUrl: 'http://localhost:1337', // Update this to your Strapi base URL
	credentials: 'include',
	prepareHeaders: (headers, { getState }) => {
	  const token = getState().auth.token;
	  if (token) {
		headers.set('Authorization', `Bearer ${token}`);
	  }
	  return headers;
	},
  });

const baseQueryWithReauth = async (args, api, extraOptions) => {
	let result = await baseQuery(args, api, extraOptions);

	if (result?.error?.originalStatus === 403) {
		//remove in production
		console.log('sending refresh token');
		// send refresh token to get new access token
		const refreshResult = await baseQuery('/refresh', api, extraOptions);
		//remove in production
		console.log(refreshResult);
		if (refreshResult?.data) {
			const user = api.getState().auth.user;
			// store the new token
			api.dispatch(setCredentials({ ...refreshResult.data, user }));
			// retry the original query with new access token
			result = await baseQuery(args, api, extraOptions);
		} else {
			api.dispatch(logOut());
		}
	}

	return result;
};

export const apiSlice = createApi({
	baseQuery: baseQueryWithReauth,
	endpoints: (builder) => ({}),
});
