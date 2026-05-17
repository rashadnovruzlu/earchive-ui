import { useState, type FormEvent } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  InputAdornment,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PersonOutlineRounded from '@mui/icons-material/PersonOutlineRounded';
import ArchiveRounded from '@mui/icons-material/ArchiveRounded';
import SecurityRounded from '@mui/icons-material/SecurityRounded';
import FolderSpecialRounded from '@mui/icons-material/FolderSpecialRounded';
import PhoneAndroidRounded from '@mui/icons-material/PhoneAndroidRounded';
import { useAuth } from '../features/auth/AuthProvider';

export function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Admin123!');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await login({ username, password });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Giriş uğursuz oldu.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Box
      className="page-shell page-fade-in"
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        px: 2,
        py: 4,
        background: 'linear-gradient(160deg, #eef3f7 0%, #e6eef5 100%)'
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 1080,
          overflow: 'hidden',
          borderRadius: 4,
          border: '1px solid',
          borderColor: 'rgba(16,58,89,0.14)',
          boxShadow: 'none'
        }}
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.1fr 0.9fr' } }}>
          {/* Left branding panel */}
          <Box
            sx={{
              p: { xs: 4, md: 6 },
              background: 'linear-gradient(155deg, #0f4c81 0%, #2f6b9f 100%)',
              color: 'common.white',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 4,
              minHeight: { xs: 260, md: 640 },
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -80,
                right: -80,
                width: 320,
                height: 320,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.09)',
                animation: 'floatBubble 8s ease-in-out infinite',
                pointerEvents: 'none'
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: -120,
                left: -60,
                width: 280,
                height: 280,
                borderRadius: '50%',
                background: 'rgba(255,138,61,0.16)',
                animation: 'floatBubble 10s ease-in-out infinite reverse',
                pointerEvents: 'none'
              },
              '@keyframes floatBubble': {
                '0%': { transform: 'translateY(0px)' },
                '50%': { transform: 'translateY(10px)' },
                '100%': { transform: 'translateY(0px)' }
              }
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 4 }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2.5,
                    bgcolor: '#ff8a3d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <ArchiveRounded sx={{ color: '#13202b', fontSize: 24 }} />
                </Box>
                <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
                  EArchive
                </Typography>
              </Stack>

              <Chip
                label="İdarəetmə Paneli"
                sx={{ mb: 3, bgcolor: 'rgba(255,255,255,0.14)', color: '#f2f7fb', border: '1px solid rgba(255,255,255,0.28)', fontWeight: 600 }}
              />
              <Typography variant="h1" sx={{ mb: 2, lineHeight: 1.2 }}>
                Arxiv əməliyyatlarını bir iş mühitindən idarə edin.
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.7 }}>
                Giriş idarəetməsi, sənəd növlərinin saxlanması və arxiv qaydalarınızla uyğun istinad sahələrini idarə etmək üçün daxil olun.
              </Typography>
            </Box>

            <Box sx={{ position: 'relative', zIndex: 1 }}>
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)', mb: 3 }} />
              <Stack spacing={2}>
                {[
                  { icon: <SecurityRounded fontSize="small" />, text: 'Rol əsaslı icazələr' },
                  { icon: <FolderSpecialRounded fontSize="small" />, text: 'Sənəd metadata quraşdırması' },
                  { icon: <PhoneAndroidRounded fontSize="small" />, text: 'Mobil uyğun admin interfeysi' }
                ].map((feature) => (
                  <Stack key={feature.text} direction="row" spacing={1.5} alignItems="center">
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 2,
                        bgcolor: 'rgba(255,255,255,0.14)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#f3f7fb',
                        flexShrink: 0
                      }}
                    >
                      {feature.icon}
                    </Box>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                      {feature.text}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Box>

          {/* Right form panel */}
          <CardContent sx={{ p: { xs: 4, md: 6 }, display: 'flex', alignItems: 'center', bgcolor: 'background.paper' }}>
            <Stack component="form" spacing={3} onSubmit={handleSubmit} sx={{ width: '100%' }} className="card-reveal stagger-1">
              <Box>
                <Typography color="primary.main" fontWeight={700} variant="overline" sx={{ letterSpacing: 1.5 }}>
                  Xoş gəldiniz
                </Typography>
                <Typography variant="h2" sx={{ mt: 0.5 }}>Daxil olun</Typography>
                <Typography color="text.secondary" sx={{ mt: 1, lineHeight: 1.6 }}>
                  Arxiv administratoru etimadnamələrinizdən istifadə edərək davam edin.
                </Typography>
              </Box>

              <Stack spacing={2.5}>
                <TextField
                  label="İstifadəçi adı"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                  autoComplete="username"
                  fullWidth
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonOutlineRounded color="action" />
                        </InputAdornment>
                      )
                    }
                  }}
                />
                <TextField
                  label="Şifrə"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  autoComplete="current-password"
                  fullWidth
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlinedIcon color="action" />
                        </InputAdornment>
                      )
                    }
                  }}
                />
              </Stack>

              {error ? <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert> : null}

              <Button size="large" type="submit" variant="contained" disabled={isSubmitting} sx={{ py: 1.5 }}>
                {isSubmitting ? 'Daxil olunur...' : 'Admin panelinə daxil olun'}
              </Button>
            </Stack>
          </CardContent>
        </Box>
      </Card>
    </Box>
  );
}