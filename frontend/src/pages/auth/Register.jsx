import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import './Auth.scss';

export default function Register() {
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get('role') === 'tailor' ? 'tailor' : 'customer';

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: defaultRole
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const user = await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role
      });

      toast.success('Account created successfully!');

      if (user.role === 'tailor') {
        navigate('/tailor/dashboard');
      } else {
        navigate('/');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Create Account</h1>
            <p>Join Tailor Connect today</p>
          </div>

          <div className="role-toggle">
            <button
              type="button"
              className={`role-btn ${formData.role === 'customer' ? 'active' : ''}`}
              onClick={() => setFormData(prev => ({ ...prev, role: 'customer' }))}
            >
              I'm a Customer
            </button>
            <button
              type="button"
              className={`role-btn ${formData.role === 'tailor' ? 'active' : ''}`}
              onClick={() => setFormData(prev => ({ ...prev, role: 'tailor' }))}
            >
              I'm a Tailor
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-row">
              <Input
                label="First Name"
                name="firstName"
                placeholder="John"
                value={formData.firstName}
                onChange={handleChange}
                error={errors.firstName}
              />
              <Input
                label="Last Name"
                name="lastName"
                placeholder="Doe"
                value={formData.lastName}
                onChange={handleChange}
                error={errors.lastName}
              />
            </div>

            <Input
              label="Email"
              type="email"
              name="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
            />

            <Input
              label="Password"
              type="password"
              name="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
            />

            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
            />

            <p className="auth-terms">
              By signing up, you agree to our{' '}
              <Link to="/terms">Terms of Service</Link> and{' '}
              <Link to="/privacy">Privacy Policy</Link>.
            </p>

            <Button type="submit" fullWidth loading={loading}>
              Create Account
            </Button>
          </form>

          <div className="auth-footer">
            <p>
              Already have an account?{' '}
              <Link to="/login">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
