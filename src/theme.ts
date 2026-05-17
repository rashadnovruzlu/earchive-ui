import { alpha, createTheme } from '@mui/material/styles';

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#0f4c81',
      light: '#2f6b9f',
      dark: '#0b365c',
      contrastText: '#ffffff'
    },
    secondary: {
      main: '#ff8a3d',
      light: '#ffa264',
      dark: '#d86722',
      contrastText: '#13202b'
    },
    background: {
      default: '#eef3f7',
      paper: '#f8fbfd'
    },
    error: {
      main: '#ba1a1a'
    },
    success: {
      main: '#1b873e'
    },
    warning: {
      main: '#e65100'
    },
    text: {
      primary: '#13202b',
      secondary: '#4f5f6f'
    }
  },
  shape: {
    borderRadius: 14
  },
  typography: {
    fontFamily: '"Avenir Next", "Manrope", "Segoe UI Variable", sans-serif',
    h1: {
      fontSize: '2.1rem',
      fontWeight: 700,
      letterSpacing: '-0.03em'
    },
    h2: {
      fontSize: '1.7rem',
      fontWeight: 700,
      letterSpacing: '-0.025em'
    },
    h3: {
      fontSize: '1.35rem',
      fontWeight: 600
    },
    h4: {
      fontWeight: 700
    },
    h5: {
      fontWeight: 600
    },
    h6: {
      fontWeight: 600
    },
    button: {
      fontWeight: 600,
      letterSpacing: '0.01em'
    }
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ':root': {
          '--surface-soft': '#f5f9fc',
          '--surface-strong': '#eaf1f7',
          '--outline-soft': 'rgba(16, 58, 89, 0.12)'
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          border: '1px solid rgba(16, 58, 89, 0.12)',
          backgroundImage: 'none'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: 'none'
        }
      }
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true
      },
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
          paddingLeft: 20,
          paddingRight: 20,
          transition: 'transform 180ms ease, background-color 180ms ease, border-color 180ms ease',
          '&:hover': {
            transform: 'translateY(-1px)'
          }
        },
        containedPrimary: {
          background: '#0f4c81',
          '&:hover': {
            background: '#0b365c'
          }
        },
        sizeLarge: {
          borderRadius: 14,
          paddingTop: 12,
          paddingBottom: 12
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: '#0f4c81',
          color: '#f8fafc',
          borderRight: '1px solid rgba(255,255,255,0.08)'
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: alpha('#f8fbfd', 0.95),
          borderRadius: 12,
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#0f4c81'
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderWidth: 1,
            borderColor: '#0f4c81'
          }
        }
      }
    },
    MuiSelect: {
      defaultProps: {
        MenuProps: {
          PaperProps: {
            sx: {
              mt: 0.5,
              border: '1px solid',
              borderColor: alpha('#0f4c81', 0.24),
              borderRadius: 1.5,
              boxShadow: '0 10px 28px rgba(0, 0, 0, 0.16)',
              backgroundImage: 'none'
            }
          }
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: alpha('#ffffff', 0.9),
          boxShadow: 'none'
        }
      }
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          transition: 'background-color 180ms ease, transform 180ms ease',
          '&:hover': {
            transform: 'translateX(2px)'
          }
        }
      }
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          border: '1px solid rgba(16, 58, 89, 0.12)',
          '&:before': {
            display: 'none'
          }
        }
      }
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 160ms ease'
        }
      }
    }
  }
});