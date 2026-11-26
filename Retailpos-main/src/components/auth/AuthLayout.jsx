import { Box, Stack, Typography } from "@mui/material";
import StorefrontRoundedIcon from "@mui/icons-material/StorefrontRounded";
import "./Login.css";

const LOGO = "/assets/sai-collection-logo.png";

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <Box className="sai-auth-page">
      <div className="sai-auth-glow sai-auth-glow-one" />
      <div className="sai-auth-glow sai-auth-glow-two" />

      <Box className="sai-auth-shell">
        <Box className="sai-brand-panel">
          <Box className="sai-brand-topline">
            <img src={LOGO} alt="Sai Collection logo" className="sai-brand-logo-small" />
            <Box>
              <Typography className="sai-brand-name">Sai Collection</Typography>
              <Typography className="sai-brand-location">LATUR · MAHARASHTRA</Typography>
            </Box>
          </Box>

          <Box className="sai-brand-content">
            <Box className="sai-brand-logo-wrap">
              <img src={LOGO} alt="साई कलेक्शन — Sai Collection" className="sai-brand-logo" />
            </Box>

            <Typography className="sai-brand-kicker">YOUR STORE. BEAUTIFULLY MANAGED.</Typography>
            <Typography className="sai-brand-heading">
              A smarter way to<br />run your store.
            </Typography>
            <Typography className="sai-brand-description">
              Billing, inventory, barcode management and business insights —
              thoughtfully brought together for Sai Collection.
            </Typography>

            <Box className="sai-feature-list">
              <Box className="sai-feature-item">
                <span className="sai-feature-icon"><StorefrontRoundedIcon /></span>
                <Box>
                  <Typography className="sai-feature-title">Simple store operations</Typography>
                  <Typography className="sai-feature-subtitle">Everything organised in one place</Typography>
                </Box>
              </Box>
              <Box className="sai-feature-item">
                <span className="sai-feature-check">✓</span>
                <Box>
                  <Typography className="sai-feature-title">Live business overview</Typography>
                  <Typography className="sai-feature-subtitle">Stay on top of sales and stock</Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          <Typography className="sai-brand-footnote">
            MADE FOR EVERYDAY RETAIL. BUILT FOR WHAT'S NEXT.
          </Typography>
        </Box>

        <Box className="sai-form-panel">
          <Box className="sai-mobile-brand">
            <img src={LOGO} alt="Sai Collection logo" />
            <Box>
              <Typography className="sai-mobile-brand-name">Sai Collection</Typography>
              <Typography className="sai-mobile-brand-location">LATUR · MAHARASHTRA</Typography>
            </Box>
          </Box>

          <Box className="sai-form-inner">
            <Stack spacing={1} className="sai-form-heading">
              <Typography className="sai-form-eyebrow">WELCOME TO SAI COLLECTION</Typography>
              <Typography component="h1" className="sai-form-title">{title}</Typography>
              <Typography className="sai-form-subtitle">{subtitle}</Typography>
            </Stack>

            {children}
            {footer && <Box className="sai-auth-footer">{footer}</Box>}
          </Box>

          <Typography className="sai-form-bottom-note">
            © {new Date().getFullYear()} Sai Collection, Latur. All rights reserved.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
