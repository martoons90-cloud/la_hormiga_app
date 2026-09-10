export interface DbStatusResponse {
  cockroachDb: {
    configured: boolean;
    connected: boolean;
    message: string;
    version?: string;
  };
  cloudflareR2: {
    configured: boolean;
    bucket: string | null;
    publicUrl: string | null;
    message: string;
  };
}

export async function checkSystemStatus(): Promise<DbStatusResponse> {
  try {
    const res = await fetch('/api/status');
    if (!res.ok) throw new Error('Status endpoint error');
    return await res.json();
  } catch (err: any) {
    return {
      cockroachDb: {
        configured: false,
        connected: false,
        message: 'Servidor backend o conexión no disponible',
      },
      cloudflareR2: {
        configured: false,
        bucket: null,
        publicUrl: null,
        message: 'Servidor backend o conexión no disponible',
      },
    };
  }
}

// Upload image to Cloudflare R2
export async function uploadImageToCloudflareR2(
  imageBase64: string,
  fileName: string = 'foto.jpg',
  contentType: string = 'image/jpeg'
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64, fileName, contentType }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Error al subir imagen a R2');
    }

    return { success: true, url: data.url };
  } catch (error: any) {
    console.error('Error subiendo imagen a R2:', error);
    return { success: false, error: error.message || 'Error en la subida' };
  }
}

// Generic API CRUD
export async function apiFetchCollection<T>(endpoint: string): Promise<T[] | null> {
  try {
    const res = await fetch(`/api/${endpoint}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function apiSaveItems<T>(endpoint: string, items: T[] | T): Promise<boolean> {
  try {
    const res = await fetch(`/api/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(items),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function apiDeleteItem(endpoint: string, id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/${endpoint}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return res.ok;
  } catch {
    return false;
  }
}
