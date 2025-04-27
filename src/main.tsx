
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import Home from "./pages/Home.tsx";
import NotFound from "./pages/NotFound.tsx";
import LoveLanding from "./pages/LoveLanding.tsx";
import FriendsLanding from "./pages/FriendsLanding.tsx";
import OrdersPage from "./pages/OrdersPage.tsx";
import OrderHistory from "./pages/OrderHistory.tsx";
import VerifyOrder from "./pages/VerifyOrder.tsx";
import Index from "./pages/Index.tsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.tsx";
import TermsOfService from "./pages/TermsOfService.tsx";
import ReturnPolicy from "./pages/ReturnPolicy.tsx";
import PromotionCodesPage from './pages/admin/PromotionCodesPage.tsx';

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    errorElement: <NotFound />,
    children: [
      {
        index: true,
        element: <Index />,
      },
      {
        path: "/home",
        element: <Home />,
      },
      {
        path: "/love",
        element: <LoveLanding />,
      },
      {
        path: "/friends",
        element: <FriendsLanding />,
      },
      {
        path: "/orders",
        element: <OrdersPage />,
      },
      {
        path: "/order-history",
        element: <OrderHistory />,
      },
      {
        path: "/verify-order",
        element: <VerifyOrder />,
      },
      {
        path: "/privacy-policy",
        element: <PrivacyPolicy />,
      },
      {
        path: "/terms-of-service",
        element: <TermsOfService />,
      },
      {
        path: "/return-policy",
        element: <ReturnPolicy />,
      },
      {
        path: "/admin/promotion-codes",
        element: <PromotionCodesPage />,
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
