from kr_privacy_examples.rbac import Permission, Principal, Role, has_permission, permissions_for


def test_role_permission_mapping():
    assert has_permission(Principal("u", frozenset({Role.CUSTOMER})), Permission.ORDER_READ_OWN)
    assert not has_permission(Principal("u", frozenset({Role.CUSTOMER})), Permission.USER_MANAGE)


def test_unknown_role_is_denied_by_default():
    assert permissions_for({"superuser"}) == frozenset()


def test_pii_read_is_not_attached_to_any_role():
    for role in Role:
        assert Permission.PII_READ not in permissions_for({role})


def test_endpoint_requires_permission(login):
    alice = login("alice@example.com")
    assert alice.get("/admin/users").status_code == 403
    admin = login("admin@example.com")
    assert admin.get("/admin/users").status_code == 200


def test_unauthenticated_gets_401(client_factory):
    assert client_factory().get("/orders").status_code == 401
