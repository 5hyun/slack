import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { render } from 'react-dom';
import App from '@layouts/App';
import SWRDevtools from '@jjordy/swr-devtools';

render(
  <BrowserRouter>
    {/*  이렇게 추가하면 배포하면 Devtool가 안보인다.*/}
    {process.env.NODE_ENV === 'production' ? (
      <App />
    ) : (
      <SWRDevtools>
        <App />
      </SWRDevtools>
    )}
  </BrowserRouter>,
  document.querySelector('#app'),
);
