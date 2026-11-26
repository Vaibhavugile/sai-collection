import {
  Box,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
  Avatar,
  Badge,
  Tooltip,
} from "@mui/material";

import {
  MenuRounded,
  SearchRounded,
  NotificationsNoneRounded,
  DarkModeOutlined,
  KeyboardCommandKeyRounded,
  ExpandMoreRounded,
  StorefrontRounded,
} from "@mui/icons-material";

import "./Topbar.css";

export default function Topbar({
  title = "Dashboard",
  subtitle = "",
  onMenuClick,
}) {
  return (
    <Box className="sai-topbar">
      <Box className="sai-topbar-left">
        <IconButton className="sai-topbar-menu" onClick={onMenuClick} aria-label="Open navigation">
          <MenuRounded />
        </IconButton>

        <Box className="sai-topbar-brand">
          <img src="/assets/sai-collection-logo.png" alt="Sai Collection logo" />
          <Box className="sai-topbar-brand-copy">
            <Typography className="sai-topbar-brand-name">Sai Collection</Typography>
            <Typography className="sai-topbar-brand-location">LATUR · MAHARASHTRA</Typography>
          </Box>
        </Box>

        <span className="sai-topbar-separator" />

        <Box className="sai-topbar-page">
          <Typography className="sai-topbar-page-title">{title}</Typography>
          {subtitle && <Typography className="sai-topbar-page-subtitle">{subtitle}</Typography>}
        </Box>
      </Box>

      <Box className="sai-topbar-search">
        <TextField
          fullWidth
          size="small"
          placeholder="Search products, categories..."
          inputProps={{ "aria-label": "Search products and categories" }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRounded />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Box className="sai-search-shortcut">
                    <KeyboardCommandKeyRounded />
                    <span>K</span>
                  </Box>
                </InputAdornment>
              ),
            },
          }}
        />
      </Box>

      <Box className="sai-topbar-right">
        <Tooltip title="Notifications">
          <IconButton className="sai-topbar-icon" aria-label="Notifications">
            <Badge variant="dot" color="warning" overlap="circular">
              <NotificationsNoneRounded />
            </Badge>
          </IconButton>
        </Tooltip>

        <Tooltip title="Appearance">
          <IconButton className="sai-topbar-icon sai-topbar-appearance" aria-label="Appearance">
            <DarkModeOutlined />
          </IconButton>
        </Tooltip>

        <Box className="sai-topbar-profile">
          <Avatar
            src="/assets/sai-collection-logo.png"
            alt="Sai Collection"
            className="sai-topbar-avatar"
          >
            <StorefrontRounded />
          </Avatar>
          <Box className="sai-topbar-profile-copy">
            <Typography className="sai-topbar-profile-name">Sai Collection</Typography>
            <Typography className="sai-topbar-profile-role">Store Administrator</Typography>
          </Box>
          <ExpandMoreRounded className="sai-topbar-profile-arrow" />
        </Box>
      </Box>
    </Box>
  );
}
