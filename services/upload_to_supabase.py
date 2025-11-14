import os
import uuid
from supabase import create_client
from rest_framework.response import Response
from rest_framework import status

from services.face_recognition import has_face


def upload_to_supabase(file):
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    bucket = "profile-pictures"

    if not supabase_url or not supabase_key:
        return None

    supabase = create_client(supabase_url, supabase_key)

    ext = file.name.split(".")[-1]
    file_name = f"{uuid.uuid4()}.{ext}"

    # Read once for face detection
    file_bytes = file.read()

    if not has_face(file_bytes):
        print("No Face")
        return None  # important: return clean value, NOT Response

    print("Face Detected")

    # Reset pointer so upload works
    file.seek(0)

    try:
        # Upload using SAME file bytes, don't read again
        res = supabase.storage.from_(bucket).upload(
            file_name,
            file_bytes,  # <--- use file_bytes
            file_options={"content-type": file.content_type},
        )

        if res.error:
            raise Exception(res.error)

        public_url = supabase.storage.from_(bucket).get_public_url(file_name)
        return public_url

    except Exception as e:
        print("Upload Error:", e)
        raise e  # let view handle it
