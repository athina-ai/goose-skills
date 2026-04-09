#!/usr/bin/env python3
"""
Supabase REST Client — Thin PostgREST wrapper using only urllib
---------------------------------------------------------------
Provides read/write operations against the Supabase leads table.
Designed to be imported by any skill that needs database access.

No external dependencies — uses urllib.request only, following
the zero-dependency pattern used across all tools in this project.

Usage:
    from supabase_client import SupabaseClient

    client = SupabaseClient(url, service_role_key)
    urls = client.get_all_linkedin_urls()
    count = client.upsert_leads(leads_list)
"""

import json
import urllib.request
import urllib.parse
import urllib.error


class SupabaseClient:
    """Thin REST client for Supabase PostgREST API."""

    def __init__(self, url, service_role_key):
        """
        Args:
            url: SUPABASE_URL (e.g., https://xxx.supabase.co)
            service_role_key: SUPABASE_SERVICE_ROLE_KEY
        """
        self.base_url = url.rstrip("/")
        self.rest_url = f"{self.base_url}/rest/v1"
        self.headers = {
            "apikey": service_role_key,
            "Authorization": f"Bearer {service_role_key}",
            "Content-Type": "application/json",
        }

    def _request(self, method, path, params=None, data=None, extra_headers=None):
        """Generic HTTP request to PostgREST endpoint.

        Args:
            method: HTTP method (GET, POST, HEAD, PATCH, DELETE)
            path: Table name or path (e.g., "leads")
            params: Query string parameters as dict
            data: Request body (will be JSON-encoded)
            extra_headers: Additional headers to merge

        Returns:
            Parsed JSON response, or None for HEAD/empty responses.

        Raises:
            urllib.error.HTTPError: On non-2xx responses.
        """
        url = f"{self.rest_url}/{path}"
        if params:
            url += "?" + urllib.parse.urlencode(params, doseq=True)

        body = json.dumps(data).encode("utf-8") if data is not None else None

        headers = {**self.headers}
        if extra_headers:
            headers.update(extra_headers)

        req = urllib.request.Request(url, data=body, headers=headers, method=method)

        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                if method == "HEAD":
                    return resp.headers
                raw = resp.read().decode("utf-8")
                if not raw:
                    return None
                return json.loads(raw)
        except urllib.error.HTTPError as e:
            error_body = e.read().decode("utf-8") if e.fp else ""
            print(f"  Supabase API error ({e.code}): {error_body}")
            raise

    # -- Read Operations ---------------------------------------------------

    def get_all_linkedin_urls(self):
        """Fetch all linkedin_url values from the leads table.

        Handles PostgREST pagination via Range headers (max 1000 per request).

        Returns:
            List of LinkedIn URL strings.
        """
        all_urls = []
        page_size = 1000
        offset = 0

        while True:
            range_header = f"{offset}-{offset + page_size - 1}"
            try:
                result = self._request(
                    "GET",
                    "leads",
                    params={"select": "linkedin_url"},
                    extra_headers={
                        "Range": range_header,
                        "Range-Unit": "items",
                        "Prefer": "count=exact",
                    },
                )
            except urllib.error.HTTPError as e:
                if e.code == 416:
                    # Range not satisfiable — no more rows
                    break
                raise

            if not result:
                break

            batch = [row["linkedin_url"] for row in result if row.get("linkedin_url")]
            all_urls.extend(batch)

            if len(result) < page_size:
                break
            offset += page_size

        return all_urls

    def count_leads(self, filters=None):
        """Count leads in the table, optionally with filters.

        Args:
            filters: Dict of PostgREST filter params
                     e.g., {"client_name": "eq.happy-robot"}

        Returns:
            Integer count.
        """
        params = {"select": "id"}
        if filters:
            params.update(filters)

        try:
            headers = self._request(
                "HEAD",
                "leads",
                params=params,
                extra_headers={"Prefer": "count=exact"},
            )
            # PostgREST returns count in Content-Range header: "0-24/150"
            content_range = headers.get("Content-Range", "")
            if "/" in content_range:
                total = content_range.split("/")[1]
                return int(total) if total != "*" else 0
        except urllib.error.HTTPError:
            pass
        return 0

    # -- Write Operations --------------------------------------------------

    def upsert_leads(self, leads):
        """Upsert leads into the leads table.

        Uses PostgREST's merge-duplicates resolution on the linkedin_url
        UNIQUE constraint. Sends in batches of 500 to avoid payload limits.

        Args:
            leads: List of dicts, each representing a lead row.

        Returns:
            Total number of leads sent (upserted or skipped).
        """
        if not leads:
            return 0

        batch_size = 500
        total_sent = 0

        for i in range(0, len(leads), batch_size):
            batch = leads[i : i + batch_size]
            self._request(
                "POST",
                "leads",
                data=batch,
                extra_headers={
                    "Prefer": "resolution=merge-duplicates,return=minimal",
                },
            )
            total_sent += len(batch)

        return total_sent

    def insert_leads_ignore_duplicates(self, leads):
        """Insert leads, silently skipping duplicates.

        Uses on_conflict=linkedin_url with ignoreDuplicates to skip
        any leads whose linkedin_url already exists.

        Args:
            leads: List of dicts, each representing a lead row.

        Returns:
            Total number of leads sent.
        """
        if not leads:
            return 0

        batch_size = 500
        total_sent = 0

        for i in range(0, len(leads), batch_size):
            batch = leads[i : i + batch_size]
            self._request(
                "POST",
                "leads",
                data=batch,
                extra_headers={
                    "Prefer": "resolution=ignore-duplicates,return=minimal",
                },
            )
            total_sent += len(batch)

        return total_sent

    # -- Utility -----------------------------------------------------------

    def test_connection(self):
        """Test that we can reach the Supabase API.

        Returns:
            True if connection succeeds, False otherwise.
        """
        try:
            self._request(
                "GET",
                "leads",
                params={"select": "id", "limit": "1"},
            )
            return True
        except Exception as e:
            print(f"  Supabase connection test failed: {e}")
            return False
