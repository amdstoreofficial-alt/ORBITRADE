"""
ORBITRADE Admin Features Tests - Iteration 12
Tests for:
1. Tournament admin controls (PUT/DELETE /api/admin/tournaments/{id})
2. Payment settings management (GET/POST /api/admin/payment-settings)
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAdminAuth:
    """Test admin authentication"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@orbitrade.live",
            "password": "password"
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        return data["access_token"]
    
    @pytest.fixture(scope="class")
    def admin_headers(self, admin_token):
        """Get headers with admin auth"""
        return {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
    
    def test_admin_login(self, admin_token):
        """Verify admin can login"""
        assert admin_token is not None
        assert len(admin_token) > 0
        print("✓ Admin login successful")


class TestTournamentAdminControls:
    """Test tournament admin CRUD operations"""
    
    @pytest.fixture(scope="class")
    def admin_headers(self):
        """Get admin auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@orbitrade.live",
            "password": "password"
        })
        assert response.status_code == 200
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    @pytest.fixture(scope="class")
    def test_tournament_id(self, admin_headers):
        """Create a test tournament and return its ID"""
        tournament_data = {
            "name": "TEST_Admin_Control_Tournament",
            "description": "Test tournament for admin controls",
            "tournament_type": "weekly",
            "prize_pool": 500,
            "prizes": [250, 150, 100],
            "start_date": datetime.now().isoformat(),
            "end_date": (datetime.now() + timedelta(days=7)).isoformat()
        }
        response = requests.post(f"{BASE_URL}/api/admin/tournaments", 
                                 json=tournament_data, headers=admin_headers)
        assert response.status_code == 200, f"Failed to create tournament: {response.text}"
        data = response.json()
        assert "id" in data
        print(f"✓ Created test tournament: {data['id']}")
        return data["id"]
    
    def test_get_tournaments_list(self, admin_headers):
        """Test GET /api/tournaments returns list"""
        response = requests.get(f"{BASE_URL}/api/tournaments", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ GET /api/tournaments returns {len(data)} tournaments")
    
    def test_update_tournament_name(self, admin_headers, test_tournament_id):
        """Test PUT /api/admin/tournaments/{id} - update name"""
        update_data = {"name": "TEST_Updated_Tournament_Name"}
        response = requests.put(f"{BASE_URL}/api/admin/tournaments/{test_tournament_id}",
                               json=update_data, headers=admin_headers)
        assert response.status_code == 200, f"Update failed: {response.text}"
        data = response.json()
        assert "message" in data
        print("✓ Tournament name updated successfully")
    
    def test_update_tournament_prize_pool(self, admin_headers, test_tournament_id):
        """Test PUT /api/admin/tournaments/{id} - update prize pool"""
        update_data = {"prize_pool": 1000}
        response = requests.put(f"{BASE_URL}/api/admin/tournaments/{test_tournament_id}",
                               json=update_data, headers=admin_headers)
        assert response.status_code == 200, f"Update failed: {response.text}"
        print("✓ Tournament prize pool updated successfully")
    
    def test_stop_tournament(self, admin_headers, test_tournament_id):
        """Test PUT /api/admin/tournaments/{id} - change status to ended"""
        update_data = {"status": "ended"}
        response = requests.put(f"{BASE_URL}/api/admin/tournaments/{test_tournament_id}",
                               json=update_data, headers=admin_headers)
        assert response.status_code == 200, f"Stop failed: {response.text}"
        print("✓ Tournament stopped (status changed to ended)")
    
    def test_resume_tournament(self, admin_headers, test_tournament_id):
        """Test PUT /api/admin/tournaments/{id} - change status back to active"""
        update_data = {"status": "active"}
        response = requests.put(f"{BASE_URL}/api/admin/tournaments/{test_tournament_id}",
                               json=update_data, headers=admin_headers)
        assert response.status_code == 200, f"Resume failed: {response.text}"
        print("✓ Tournament resumed (status changed to active)")
    
    def test_delete_tournament(self, admin_headers, test_tournament_id):
        """Test DELETE /api/admin/tournaments/{id}"""
        response = requests.delete(f"{BASE_URL}/api/admin/tournaments/{test_tournament_id}",
                                  headers=admin_headers)
        assert response.status_code == 200, f"Delete failed: {response.text}"
        data = response.json()
        assert "message" in data
        print("✓ Tournament deleted successfully")
    
    def test_delete_nonexistent_tournament(self, admin_headers):
        """Test DELETE /api/admin/tournaments/{id} with invalid ID"""
        fake_id = "000000000000000000000000"
        response = requests.delete(f"{BASE_URL}/api/admin/tournaments/{fake_id}",
                                  headers=admin_headers)
        assert response.status_code == 404
        print("✓ Delete nonexistent tournament returns 404")


class TestPaymentSettings:
    """Test payment settings admin endpoints"""
    
    @pytest.fixture(scope="class")
    def admin_headers(self):
        """Get admin auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "admin@orbitrade.live",
            "password": "password"
        })
        assert response.status_code == 200
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    def test_get_payment_settings(self, admin_headers):
        """Test GET /api/admin/payment-settings"""
        response = requests.get(f"{BASE_URL}/api/admin/payment-settings", headers=admin_headers)
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        
        # Verify expected fields exist
        expected_fields = [
            "deposit_fee_percent", "deposit_fee_fixed", "min_deposit", "max_deposit",
            "withdrawal_fee_percent", "withdrawal_fee_fixed", "min_withdrawal", "max_withdrawal",
            "withdrawal_processing_time", "auto_approve_deposits_below", "auto_approve_withdrawals_below"
        ]
        for field in expected_fields:
            assert field in data, f"Missing field: {field}"
        
        print(f"✓ GET /api/admin/payment-settings returns all expected fields")
        print(f"  - Deposit fee: {data['deposit_fee_percent']}% + ${data['deposit_fee_fixed']}")
        print(f"  - Withdrawal fee: {data['withdrawal_fee_percent']}% + ${data['withdrawal_fee_fixed']}")
    
    def test_save_payment_settings(self, admin_headers):
        """Test POST /api/admin/payment-settings"""
        new_settings = {
            "deposit_fee_percent": 1.5,
            "deposit_fee_fixed": 2.0,
            "min_deposit": 25,
            "max_deposit": 100000,
            "withdrawal_fee_percent": 3.0,
            "withdrawal_fee_fixed": 10.0,
            "min_withdrawal": 50,
            "max_withdrawal": 25000,
            "withdrawal_processing_time": "48h",
            "auto_approve_deposits_below": 500,
            "auto_approve_withdrawals_below": 200
        }
        
        response = requests.post(f"{BASE_URL}/api/admin/payment-settings",
                                json=new_settings, headers=admin_headers)
        assert response.status_code == 200, f"Save failed: {response.text}"
        data = response.json()
        assert "message" in data
        print("✓ POST /api/admin/payment-settings saves successfully")
    
    def test_verify_payment_settings_persisted(self, admin_headers):
        """Verify saved payment settings are persisted"""
        response = requests.get(f"{BASE_URL}/api/admin/payment-settings", headers=admin_headers)
        assert response.status_code == 200
        data = response.json()
        
        # Verify the settings we saved
        assert data["deposit_fee_percent"] == 1.5
        assert data["deposit_fee_fixed"] == 2.0
        assert data["min_deposit"] == 25
        assert data["withdrawal_fee_percent"] == 3.0
        assert data["withdrawal_processing_time"] == "48h"
        print("✓ Payment settings persisted correctly")
    
    def test_reset_payment_settings(self, admin_headers):
        """Reset payment settings to defaults"""
        default_settings = {
            "deposit_fee_percent": 0,
            "deposit_fee_fixed": 0,
            "min_deposit": 10,
            "max_deposit": 50000,
            "withdrawal_fee_percent": 2,
            "withdrawal_fee_fixed": 5,
            "min_withdrawal": 20,
            "max_withdrawal": 10000,
            "withdrawal_processing_time": "24h",
            "auto_approve_deposits_below": 0,
            "auto_approve_withdrawals_below": 0
        }
        
        response = requests.post(f"{BASE_URL}/api/admin/payment-settings",
                                json=default_settings, headers=admin_headers)
        assert response.status_code == 200
        print("✓ Payment settings reset to defaults")


class TestPaymentSettingsUnauthorized:
    """Test payment settings require admin auth"""
    
    @pytest.fixture(scope="class")
    def user_headers(self):
        """Get regular user auth headers"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "masteruser@orbitrade.live",
            "password": "password"
        })
        assert response.status_code == 200
        token = response.json()["access_token"]
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    def test_get_payment_settings_as_user(self, user_headers):
        """Regular user should not access payment settings"""
        response = requests.get(f"{BASE_URL}/api/admin/payment-settings", headers=user_headers)
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✓ Regular user cannot access payment settings (403)")
    
    def test_save_payment_settings_as_user(self, user_headers):
        """Regular user should not save payment settings"""
        response = requests.post(f"{BASE_URL}/api/admin/payment-settings",
                                json={"deposit_fee_percent": 10}, headers=user_headers)
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✓ Regular user cannot save payment settings (403)")


class TestHealthAndBasicEndpoints:
    """Basic health checks"""
    
    def test_health_endpoint(self):
        """Test /api/health"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        print("✓ /api/health returns 200")
    
    def test_assets_endpoint(self):
        """Test /api/assets"""
        response = requests.get(f"{BASE_URL}/api/assets")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        print(f"✓ /api/assets returns {len(data)} assets")
    
    def test_prices_endpoint(self):
        """Test /api/prices"""
        response = requests.get(f"{BASE_URL}/api/prices")
        assert response.status_code == 200
        data = response.json()
        assert "crypto" in data or "forex" in data or "metals" in data
        print("✓ /api/prices returns price data")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
