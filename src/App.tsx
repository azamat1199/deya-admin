import { Routes, Route, Navigate } from "react-router-dom";
import { AdminLayout } from "./layouts/AdminLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Placeholder } from "./pages/Placeholder";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/users/Users";
import AboutLayout from "./pages/about/AboutLayout";
import ExportRegions from "./pages/about/ExportRegions";
import Slides from "./pages/about/Slides";
import Stats from "./pages/about/Stats";
import Timeline from "./pages/about/Timeline";
import Factory from "./pages/about/Factory";
import BlogLayout from "./pages/blog/BlogLayout";
import Posts from "./pages/blog/Posts";
import PostBlocks from "./pages/blog/PostBlocks";
import CareersLayout from "./pages/careers/CareersLayout";
import CareerValues from "./pages/careers/CareerValues";
import Companies from "./pages/careers/Companies";
import ProductInfo from "./pages/careers/ProductInfo";
import CatalogLayout from "./pages/catalog/CatalogLayout";
import Categories from "./pages/catalog/Categories";
import Flavors from "./pages/catalog/Flavors";
import ProductFamilies from "./pages/catalog/ProductFamilies";
import ProductImages from "./pages/catalog/ProductImages";
import Products from "./pages/catalog/Products";
import ProductCreate from "./pages/catalog/ProductCreate";
import ProductEdit from "./pages/catalog/ProductEdit";
import Weights from "./pages/catalog/Weights";
import LeadsLayout from "./pages/leads/LeadsLayout";
import Leads from "./pages/leads/Leads";
import Subscriptions from "./pages/leads/Subscriptions";
import PagesLayout from "./pages/pages/PagesLayout";
import Settings from "./pages/pages/Settings";
import StaticPages from "./pages/pages/StaticPages";
import StaticPageEditor from "./pages/pages/StaticPageEditor";
import PrivacyPolicy from "./pages/pages/PrivacyPolicy";
import PrivacyPolicyPageEditor from "./pages/pages/PrivacyPolicyPageEditor";
import PartnersLayout from "./pages/partners/PartnersLayout";
import Certificates from "./pages/partners/Certificates";
import PartnersList from "./pages/partners/PartnersList";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/about" element={<AboutLayout />}>
          <Route index element={<Navigate to="export-regions" replace />} />
          <Route path="export-regions" element={<ExportRegions />} />
          <Route path="slides" element={<Slides />} />
          <Route path="stats" element={<Stats />} />
          <Route path="timeline" element={<Timeline />} />
          <Route path="factory" element={<Factory />} />
        </Route>
        <Route path="/blog" element={<BlogLayout />}>
          <Route index element={<Navigate to="posts" replace />} />
          <Route path="posts" element={<Posts />} />
          <Route path="post-blocks" element={<PostBlocks />} />
        </Route>
        <Route path="/careers" element={<CareersLayout />}>
          <Route index element={<Navigate to="career-values" replace />} />
          <Route path="career-values" element={<CareerValues />} />
          <Route path="companies" element={<Companies />} />
          <Route path="product-info" element={<ProductInfo />} />
        </Route>
        <Route path="/catalog" element={<CatalogLayout />}>
          <Route index element={<Navigate to="products" replace />} />
          <Route path="products" element={<Products />} />
          <Route path="products/create" element={<ProductCreate />} />
          <Route path="products/:id/edit" element={<ProductEdit />} />
          <Route path="categories" element={<Categories />} />
          <Route path="flavors" element={<Flavors />} />
          <Route path="product-families" element={<ProductFamilies />} />
          <Route path="product-images" element={<ProductImages />} />
          <Route path="weights" element={<Weights />} />
        </Route>
        <Route path="/leads" element={<LeadsLayout />}>
          <Route index element={<Navigate to="leads" replace />} />
          <Route path="leads" element={<Leads />} />
          <Route path="subscriptions" element={<Subscriptions />} />
        </Route>
        <Route path="/pages" element={<PagesLayout />}>
          <Route index element={<Navigate to="settings" replace />} />
          <Route path="settings" element={<Settings />} />
          <Route path="static-pages" element={<StaticPages />} />
          <Route path="static-pages/create" element={<StaticPageEditor />} />
          <Route path="static-pages/:id/edit" element={<StaticPageEditor />} />
          <Route path="privacy-policy" element={<PrivacyPolicy />} />
          <Route path="privacy-policy/:slug/edit" element={<PrivacyPolicyPageEditor />} />
        </Route>
        <Route path="/partners" element={<PartnersLayout />}>
          <Route index element={<Navigate to="partners" replace />} />
          <Route path="partners" element={<PartnersList />} />
          <Route path="certificates" element={<Certificates />} />
        </Route>
        <Route path="/users" element={<Users />} />
        <Route path="/auth" element={<Placeholder titleKey="auth" />} />
      </Route>
    </Routes>
  );
}

export default App;
