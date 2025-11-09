import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Link,
  Divider,
  CircularProgress,
} from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { GoogleIcon, FacebookIcon, SitemarkIcon } from '../common/CustomIcons';

const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard'); // ✅ redirect after login
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          width: 400,
          p: 4,
          boxShadow: 3,
          borderRadius: 2,
          bgcolor: 'background.paper',
        }}
      >
        <Box display="flex" justifyContent="center" mb={2}>
          <SitemarkIcon />
        </Box>

        <Typography variant="h4" gutterBottom textAlign="center">
          Sign In
        </Typography>

        {error && (
          <Typography color="error" variant="body2" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}

        <TextField
          fullWidth
          margin="normal"
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <TextField
          fullWidth
          margin="normal"
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={loading}
          sx={{ mt: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Sign In'}
        </Button>

        <Link
          component={RouterLink}
          to="/forgot-password"
          variant="body2"
          sx={{ mt: 2, display: 'block', textAlign: 'center' }}
        >
          Forgot password?
        </Link>

        <Divider sx={{ my: 2 }}>or</Divider>

        <Button fullWidth variant="outlined" startIcon={<GoogleIcon />}>
          Sign in with Google
        </Button>
        <Button fullWidth variant="outlined" startIcon={<FacebookIcon />} sx={{ mt: 1 }}>
          Sign in with Facebook
        </Button>

        <Typography sx={{ textAlign: 'center', mt: 2 }}>
          Don’t have an account?{' '}
          <Link component={RouterLink} to="/register">
            Sign up
          </Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default Login;
