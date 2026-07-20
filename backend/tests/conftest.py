import os
import pytest
import psycopg

@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    # Parse existing database URL
    orig_url = os.getenv(
        "PRISM_DATABASE_URL",
        "postgresql://prism:prism_dev_only@127.0.0.1:5432/prism",
    )
    
    # Construct connection URL pointing to postgres admin database to allow database creation
    base_url = orig_url.rsplit("/", 1)[0] + "/postgres"
    test_db_url = orig_url.rsplit("/", 1)[0] + "/prism_test"
    
    try:
        with psycopg.connect(base_url, autocommit=True) as conn:
            with conn.cursor() as cur:
                # Check if prism_test database exists
                cur.execute("SELECT 1 FROM pg_database WHERE datname = 'prism_test'")
                if not cur.fetchone():
                    cur.execute("CREATE DATABASE prism_test")
                    print("\n[Test DB] Created dedicated 'prism_test' database successfully.")
    except Exception as e:
        print(f"\n[Test DB Warning] Could not verify/create prism_test DB: {e}")
        
    # Set the test database URL as active for all tests to protect dev database from TRUNCATE queries
    os.environ["PRISM_DATABASE_URL"] = test_db_url
    yield
