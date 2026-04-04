"""
ORBITAL Trading Platform - Demo/Real Account Mode Tests
Testing new features:
- Account setup after registration (demo/real mode selection)
- Account mode switching with separate balances
- Demo mode restrictions on withdrawals
- GET /api/auth/me returns account_mode, demo_balance, real_balance
"""
import pytest
import requests
import os
import time
import random

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
MASTER_USER_EMAIL = "masteruser@orbitrade.live"
MASTER_USER_PASSWORD = "password"


class TestAccountSetupAPI:
    """Test /api/user/setup-account endpoint"""
    
    def test_register_creates_user_with_null_account_mode(self):
        """POST /api/auth/register creates user with account_mode: null"""
        # Generate unique email for this test
        unique_email = f"testuser_{int(time.time())}_{random.randint(1000,9999)}@test.com"
        
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "test123",
            "full_name": "Test User"
        })
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        
        # Verify user data
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == unique_email
        assert data["user"]["account_mode"] is None, f"Expected account_mode=None, got {data['user']['account_mode']}"
        print(f"✓ New user registered with account_mode: null")
        
        return data["access_token"]
    
    def test_setup_account_demo_mode(self):
        """POST /api/user/setup-account with account_mode=demo sets balance to 10000"""
        # Register new user
        unique_email = f"demo_user_{int(time.time())}_{random.randint(1000,9999)}@test.com"
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "test123",
            "full_name": "Demo User"
        })
        assert reg_response.status_code == 200
        token = reg_response.json()["access_token"]
        
        # Setup as demo account
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(f"{BASE_URL}/api/user/setup-account",
            headers=headers,
            json={"account_mode": "demo"})
        
        assert response.status_code == 200, f"Setup failed: {response.text}"
        data = response.json()
        
        assert data["account_mode"] == "demo"
        assert data["balance"] == 10000.0, f"Expected balance 10000, got {data['balance']}"
        assert data["demo_balance"] == 10000.0
        assert data["real_balance"] == 0.0
        print(f"✓ Demo account setup: balance=${data['balance']}")
    
    def test_setup_account_real_mode(self):
        """POST /api/user/setup-account with account_mode=real sets balance to 0"""
        # Register new user
        unique_email = f"real_user_{int(time.time())}_{random.randint(1000,9999)}@test.com"
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "test123",
            "full_name": "Real User"
        })
        assert reg_response.status_code == 200
        token = reg_response.json()["access_token"]
        
        # Setup as real account
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.post(f"{BASE_URL}/api/user/setup-account",
            headers=headers,
            json={"account_mode": "real"})
        
        assert response.status_code == 200, f"Setup failed: {response.text}"
        data = response.json()
        
        assert data["account_mode"] == "real"
        assert data["balance"] == 0.0, f"Expected balance 0, got {data['balance']}"
        assert data["real_balance"] == 0.0
        print(f"✓ Real account setup: balance=${data['balance']}")


class TestAccountModeSwitch:
    """Test /api/user/switch-account endpoint"""
    
    @pytest.fixture
    def demo_user_token(self):
        """Create a new user with demo mode for testing"""
        unique_email = f"switch_user_{int(time.time())}_{random.randint(1000,9999)}@test.com"
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "test123",
            "full_name": "Switch User"
        })
        assert reg_response.status_code == 200
        token = reg_response.json()["access_token"]
        
        # Setup as demo
        headers = {"Authorization": f"Bearer {token}"}
        requests.post(f"{BASE_URL}/api/user/setup-account",
            headers=headers,
            json={"account_mode": "demo"})
        
        return token
    
    def test_switch_demo_to_real(self, demo_user_token):
        """POST /api/user/switch-account toggles from demo to real, preserves balances"""
        headers = {"Authorization": f"Bearer {demo_user_token}"}
        
        # First verify we're in demo mode
        me_response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        assert me_response.status_code == 200
        initial = me_response.json()
        assert initial["account_mode"] == "demo"
        initial_demo_balance = initial["balance"]
        
        # Switch to real
        response = requests.post(f"{BASE_URL}/api/user/switch-account",
            headers=headers,
            json={"account_mode": "real"})
        
        assert response.status_code == 200, f"Switch failed: {response.text}"
        data = response.json()
        
        assert data["account_mode"] == "real", f"Expected real, got {data['account_mode']}"
        assert data["balance"] == 0.0, f"Real balance should be 0, got {data['balance']}"
        assert data["demo_balance"] == initial_demo_balance, "Demo balance should be preserved"
        print(f"✓ Switched demo→real: demo_balance=${data['demo_balance']}, real_balance=${data['balance']}")
    
    def test_switch_real_to_demo(self, demo_user_token):
        """POST /api/user/switch-account toggles from real back to demo"""
        headers = {"Authorization": f"Bearer {demo_user_token}"}
        
        # Switch to real first
        requests.post(f"{BASE_URL}/api/user/switch-account",
            headers=headers,
            json={"account_mode": "real"})
        
        # Now switch back to demo
        response = requests.post(f"{BASE_URL}/api/user/switch-account",
            headers=headers,
            json={"account_mode": "demo"})
        
        assert response.status_code == 200, f"Switch failed: {response.text}"
        data = response.json()
        
        assert data["account_mode"] == "demo"
        assert data["balance"] == data["demo_balance"], "Balance should be demo_balance"
        print(f"✓ Switched real→demo: balance=${data['balance']}")
    
    def test_switch_to_same_mode_fails(self, demo_user_token):
        """Switching to same mode should return 400 error"""
        headers = {"Authorization": f"Bearer {demo_user_token}"}
        
        # Try to switch to demo when already in demo
        response = requests.post(f"{BASE_URL}/api/user/switch-account",
            headers=headers,
            json={"account_mode": "demo"})
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✓ Switching to same mode correctly rejected with 400")


class TestDemoModeRestrictions:
    """Test demo mode restrictions on withdrawals and affiliate"""
    
    @pytest.fixture
    def demo_user_token(self):
        """Create a new user with demo mode"""
        unique_email = f"demo_restrict_{int(time.time())}_{random.randint(1000,9999)}@test.com"
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "test123",
            "full_name": "Demo Restrict User"
        })
        token = reg_response.json()["access_token"]
        
        # Setup as demo
        headers = {"Authorization": f"Bearer {token}"}
        requests.post(f"{BASE_URL}/api/user/setup-account",
            headers=headers,
            json={"account_mode": "demo"})
        
        return token
    
    def test_withdrawal_blocked_in_demo_mode(self, demo_user_token):
        """POST /api/withdrawals blocked in demo mode returns 400 error"""
        headers = {"Authorization": f"Bearer {demo_user_token}"}
        
        response = requests.post(f"{BASE_URL}/api/withdrawals",
            headers=headers,
            json={
                "amount": 100,
                "currency": "USD",
                "method": "crypto",
                "wallet_address": "bc1q123456"
            })
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        data = response.json()
        assert "demo" in data.get("detail", "").lower() or "real" in data.get("detail", "").lower(), \
            f"Error should mention demo/real account: {data}"
        print(f"✓ Withdrawal blocked in demo mode: {data.get('detail')}")


class TestAuthMeEndpoint:
    """Test /api/auth/me returns complete account info"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MASTER_USER_EMAIL,
            "password": MASTER_USER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Authentication failed")
        return response.json()["access_token"]
    
    def test_auth_me_returns_account_mode_fields(self, auth_token):
        """GET /api/auth/me returns account_mode, demo_balance, real_balance"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify all required fields are present
        assert "account_mode" in data, "Missing account_mode field"
        assert "demo_balance" in data, "Missing demo_balance field"
        assert "real_balance" in data, "Missing real_balance field"
        assert "balance" in data, "Missing balance field"
        
        print(f"✓ /api/auth/me returns: account_mode={data['account_mode']}, "
              f"demo_balance=${data.get('demo_balance', 0)}, real_balance=${data.get('real_balance', 0)}")


class TestTradingInBothModes:
    """Test trading works in both demo and real modes"""
    
    @pytest.fixture
    def demo_user_token(self):
        """Create a new user with demo mode"""
        unique_email = f"trade_demo_{int(time.time())}_{random.randint(1000,9999)}@test.com"
        reg_response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "test123",
            "full_name": "Trade Demo User"
        })
        token = reg_response.json()["access_token"]
        
        # Setup as demo
        headers = {"Authorization": f"Bearer {token}"}
        requests.post(f"{BASE_URL}/api/user/setup-account",
            headers=headers,
            json={"account_mode": "demo"})
        
        return token
    
    def test_trading_in_demo_mode(self, demo_user_token):
        """Trading should work in demo mode"""
        headers = {"Authorization": f"Bearer {demo_user_token}"}
        
        # Get initial balance
        me_response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        initial_balance = me_response.json()["balance"]
        
        # Place a trade
        response = requests.post(f"{BASE_URL}/api/trades",
            headers=headers,
            json={
                "asset": "EUR/USD",
                "direction": "buy",
                "amount": 100,
                "expiry_seconds": 5
            })
        
        assert response.status_code == 200, f"Trade failed: {response.text}"
        
        # Verify balance decreased
        me_response2 = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        new_balance = me_response2.json()["balance"]
        assert new_balance == initial_balance - 100, f"Balance should decrease by trade amount"
        
        print(f"✓ Trading in demo mode works: ${initial_balance} → ${new_balance}")


class TestExistingUserAccountMode:
    """Test existing users like masteruser have correct account_mode"""
    
    def test_masteruser_has_real_account_mode(self):
        """masteruser@orbitrade.live should have account_mode=real"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MASTER_USER_EMAIL,
            "password": MASTER_USER_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        
        user = data["user"]
        assert user["account_mode"] == "real", \
            f"Expected masteruser to have real account mode, got {user['account_mode']}"
        print(f"✓ Existing masteruser has account_mode=real")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
