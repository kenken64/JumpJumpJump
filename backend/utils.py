def round_floats(data, decimals=2):
    """Recursively round float values in a dictionary or list"""
    if isinstance(data, dict):
        return {k: round_floats(v, decimals) for k, v in data.items()}
    elif isinstance(data, list):
        return [round_floats(v, decimals) for v in data]
    elif isinstance(data, float):
        return round(data, decimals)
    return data
