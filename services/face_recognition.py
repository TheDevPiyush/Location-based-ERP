import face_recognition


def has_face(file_bytes) -> bool:
    """Returns True if the image contains at least one human face."""
    image = face_recognition.load_image_file(file_bytes)
    face_locations = face_recognition.face_locations(image)
    print(face_locations)
    return len(face_locations) > 0