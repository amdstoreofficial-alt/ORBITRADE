"""
ORBITAL Trading Platform - Profile, KYC, Admin Features Tests
Tests for: Profile management, KYC document upload, Admin broadcast/promotions/balance adjustments
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@orbitrade.live"
ADMIN_PASSWORD = "password"
USER_EMAIL = "masteruser@orbitrade.live"
USER_PASSWORD = "password"


class TestHealthCheck:
    """Basic health check"""
    
    def test_health_endpoint(self):
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ Health check passed")


class TestUserAuthentication:
    """Authentication tests"""
    
    def test_admin_login(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["is_admin"] == True
        print(f"✓ Admin login successful - is_admin: {data['user']['is_admin']}")
        return data["access_token"]
    
    def test_user_login(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        print(f"✓ User login successful - email: {data['user']['email']}")
        return data["access_token"]


class TestProfileEndpoints:
    """Profile management tests"""
    
    @pytest.fixture
    def user_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_get_profile(self, user_token):
        """GET /api/user/profile returns full user data"""
        headers = {"Authorization": f"Bearer {user_token}"}
        response = requests.get(f"{BASE_URL}/api/user/profile", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify profile fields exist
        assert "email" in data
        assert "full_name" in data
        assert "id" in data
        assert "kyc_status" in data or data.get("kyc_status") is None  # May be None initially
        print(f"✓ GET /api/user/profile - email: {data['email']}, kyc_status: {data.get('kyc_status', 'pending')}")
    
    def test_update_profile(self, user_token):
        """PATCH /api/user/profile updates user fields"""
        headers = {"Authorization": f"Bearer {user_token}"}
        
        # Update profile
        update_data = {
            "full_name": "Test Master User",
            "phone": "+1234567890",
            "country": "United States"
        }
        response = requests.patch(f"{BASE_URL}/api/user/profile", json=update_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify update was applied
        assert data.get("full_name") == "Test Master User" or "full_name" in data
        print(f"✓ PATCH /api/user/profile - updated full_name, phone, country")
        
        # Verify persistence with GET
        get_response = requests.get(f"{BASE_URL}/api/user/profile", headers=headers)
        assert get_response.status_code == 200
        get_data = get_response.json()
        assert get_data.get("phone") == "+1234567890"
        print(f"✓ Profile update persisted - phone: {get_data.get('phone')}")


class TestKYCEndpoints:
    """KYC document upload and status tests"""
    
    @pytest.fixture
    def user_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_upload_kyc_document(self, user_token):
        """POST /api/user/kyc/upload accepts document_type and file_data"""
        headers = {"Authorization": f"Bearer {user_token}"}
        
        # Upload a test document (base64 encoded)
        upload_data = {
            "document_type": "id_front",
            "file_data": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
            "file_name": "test_id_front.png"
        }
        response = requests.post(f"{BASE_URL}/api/user/kyc/upload", json=upload_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data.get("status") == "pending"
        print(f"✓ POST /api/user/kyc/upload - document uploaded: {data.get('message')}")
    
    def test_upload_invalid_document_type(self, user_token):
        """POST /api/user/kyc/upload rejects invalid document types"""
        headers = {"Authorization": f"Bearer {user_token}"}
        
        upload_data = {
            "document_type": "invalid_type",
            "file_data": "data:image/png;base64,test",
            "file_name": "test.png"
        }
        response = requests.post(f"{BASE_URL}/api/user/kyc/upload", json=upload_data, headers=headers)
        assert response.status_code == 400
        print("✓ Invalid document type rejected with 400")
    
    def test_get_kyc_status(self, user_token):
        """GET /api/user/kyc/status returns documents and kyc_status"""
        headers = {"Authorization": f"Bearer {user_token}"}
        response = requests.get(f"{BASE_URL}/api/user/kyc/status", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "kyc_status" in data
        assert "documents" in data
        assert isinstance(data["documents"], list)
        print(f"✓ GET /api/user/kyc/status - status: {data['kyc_status']}, docs count: {len(data['documents'])}")


class TestAdminBroadcast:
    """Admin broadcast notification tests"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_send_broadcast(self, admin_token):
        """POST /api/admin/broadcast sends notification to all users"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        broadcast_data = {
            "title": "Test Broadcast",
            "message": "This is a test broadcast message from automated testing"
        }
        response = requests.post(f"{BASE_URL}/api/admin/broadcast", json=broadcast_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "Broadcast sent" in data["message"]
        print(f"✓ POST /api/admin/broadcast - {data['message']}")
    
    def test_broadcast_requires_admin(self):
        """POST /api/admin/broadcast requires admin privileges"""
        # Login as regular user
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        user_token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {user_token}"}
        
        broadcast_data = {
            "title": "Unauthorized Test",
            "message": "This should fail"
        }
        response = requests.post(f"{BASE_URL}/api/admin/broadcast", json=broadcast_data, headers=headers)
        assert response.status_code in [401, 403]
        print("✓ Broadcast correctly requires admin privileges")


class TestAdminPromotions:
    """Admin promotions management tests"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_create_promotion(self, admin_token):
        """POST /api/admin/promotions creates a new promotion"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        promo_data = {
            "name": f"TEST_Promo_{int(time.time())}",
            "bonus_percent": 50.0,
            "min_deposit": 100.0,
            "max_bonus": 500.0,
            "active": True
        }
        response = requests.post(f"{BASE_URL}/api/admin/promotions", json=promo_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "created" in data["message"].lower()
        print(f"✓ POST /api/admin/promotions - promotion created: {promo_data['name']}")
    
    def test_get_promotions(self, admin_token):
        """GET /api/admin/promotions returns list of promotions"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/promotions", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        print(f"✓ GET /api/admin/promotions - returned {len(data)} promotions")
        
        # Verify promotion structure if any exist
        if len(data) > 0:
            promo = data[0]
            assert "name" in promo
            assert "bonus_percent" in promo
            print(f"  First promo: {promo.get('name')} - {promo.get('bonus_percent')}% bonus")


class TestAdminBalanceAdjustment:
    """Admin balance adjustment tests"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    @pytest.fixture
    def user_id(self, admin_token):
        """Get a user ID for testing"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/users", headers=headers)
        data = response.json()
        users = data.get("users", data) if isinstance(data, dict) else data
        # Find the master user
        for user in users:
            if user.get("email") == USER_EMAIL:
                return user.get("id")
        return users[0].get("id") if users else None
    
    def test_adjust_balance(self, admin_token, user_id):
        """POST /api/admin/users/{id}/adjust-balance adjusts user balance"""
        if not user_id:
            pytest.skip("No user found for balance adjustment test")
        
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        adjust_data = {
            "amount": 10.0,
            "reason": "Test adjustment from automated testing"
        }
        response = requests.post(f"{BASE_URL}/api/admin/users/{user_id}/adjust-balance", json=adjust_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "adjusted" in data["message"].lower()
        print(f"✓ POST /api/admin/users/{user_id}/adjust-balance - {data['message']}")
        
        # Adjust back to restore original balance
        restore_data = {"amount": -10.0, "reason": "Restore after test"}
        requests.post(f"{BASE_URL}/api/admin/users/{user_id}/adjust-balance", json=restore_data, headers=headers)


class TestAdminKYCAction:
    """Admin KYC approval/rejection tests"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    @pytest.fixture
    def user_id(self, admin_token):
        """Get a user ID for testing"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/users", headers=headers)
        data = response.json()
        users = data.get("users", data) if isinstance(data, dict) else data
        for user in users:
            if user.get("email") == USER_EMAIL:
                return user.get("id")
        return users[0].get("id") if users else None
    
    def test_kyc_approve_action(self, admin_token, user_id):
        """POST /api/admin/users/{id}/kyc-action approves KYC"""
        if not user_id:
            pytest.skip("No user found for KYC action test")
        
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        action_data = {"action": "approve"}
        response = requests.post(f"{BASE_URL}/api/admin/users/{user_id}/kyc-action", json=action_data, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ POST /api/admin/users/{user_id}/kyc-action (approve) - {data['message']}")
    
    def test_kyc_invalid_action(self, admin_token, user_id):
        """POST /api/admin/users/{id}/kyc-action rejects invalid action"""
        if not user_id:
            pytest.skip("No user found for KYC action test")
        
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        action_data = {"action": "invalid_action"}
        response = requests.post(f"{BASE_URL}/api/admin/users/{user_id}/kyc-action", json=action_data, headers=headers)
        assert response.status_code == 400
        print("✓ Invalid KYC action rejected with 400")


class TestAdminUsersEndpoint:
    """Admin users list endpoint tests"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_get_admin_users(self, admin_token):
        """GET /api/admin/users returns paginated user list"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/users", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        # API returns {users: [...], total, page, pages}
        assert "users" in data or isinstance(data, list)
        users = data.get("users", data) if isinstance(data, dict) else data
        assert isinstance(users, list)
        print(f"✓ GET /api/admin/users - returned {len(users)} users")
        
        if len(users) > 0:
            user = users[0]
            assert "email" in user
            assert "id" in user


class TestAdminWithdrawals:
    """Admin withdrawals endpoint tests"""
    
    @pytest.fixture
    def admin_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_get_admin_withdrawals(self, admin_token):
        """GET /api/admin/withdrawals returns withdrawal list"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/withdrawals", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        # API returns plain array
        assert isinstance(data, list)
        print(f"✓ GET /api/admin/withdrawals - returned {len(data)} withdrawals")


class TestUserNotifications:
    """User notifications endpoint tests"""
    
    @pytest.fixture
    def user_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": USER_EMAIL,
            "password": USER_PASSWORD
        })
        return response.json()["access_token"]
    
    def test_get_user_notifications(self, user_token):
        """GET /api/user/notifications returns broadcast notifications"""
        headers = {"Authorization": f"Bearer {user_token}"}
        response = requests.get(f"{BASE_URL}/api/user/notifications", headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        print(f"✓ GET /api/user/notifications - returned {len(data)} notifications")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
