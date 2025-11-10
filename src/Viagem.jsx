import { useAuth0 } from "@auth0/auth0-react";
import React, { useEffect, useState } from "react";
import LoginButton from "./LoginButton";
import LogoutButton from "./LogoutButton";


function decodeJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
  } catch (e) {
    return {};
  }
}


const IP = "18.230.122.17"; // mesmo IP do backend
const BASE_URL = `http://${IP}:8080`;

export default function ViagensApp() {
  const [viagens, setViagens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [token, setToken] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  const [origem, setOrigem] = useState("");
  const [destino, setDestino] = useState("");
  const [descricao, setDescricao] = useState("");
  const [modoTransporte, setModoTransporte] = useState("CARRO");

  const { user, isAuthenticated, getAccessTokenSilently } = useAuth0();

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const accessToken = await getAccessTokenSilently();
        setToken(accessToken);
        const decoded = decodeJwt(accessToken);
        const roles = decoded.roles || decoded["https://example.com/roles"] || [];
        setIsAdmin(roles.includes("ADMIN"));
      } catch (e) {
        console.error("Erro ao buscar token:", e);
      }
    };
    if (isAuthenticated) fetchToken();
  }, [isAuthenticated, getAccessTokenSilently]);

  if (!isAuthenticated) {
    return <LoginButton />;
  }

  async function fetchViagens() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/viagens`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Erro ao carregar: ${res.status}`);
      const data = await res.json();
      setViagens(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError(null);

    const dto = { origem, destino, descricao, modoTransporte };

    try {
      const res = await fetch(`${BASE_URL}/viagens`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(dto),
      });

      if (!res.ok) throw new Error(`Erro ao criar: ${res.status}`);

      const created = await res.json();
      setViagens((prev) => [created, ...prev]);
      setOrigem("");
      setDestino("");
      setDescricao("");
      setModoTransporte("CARRO");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Deseja excluir esta viagem?")) return;
    try {
      const res = await fetch(`${BASE_URL}/viagens/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Erro ao excluir: ${res.status}`);
      setViagens((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50 font-sans">
      <div>
        <img src={user.picture} alt={user.name} />
        <h2>{user.name}</h2>
        <p>{user.email}</p>
        <LogoutButton />
      </div>

      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-bold mb-4">
          Viagens — Cadastro e Listagem
        </h1>

        <form onSubmit={handleCreate} className="space-y-3 mb-6">
          <div className="grid grid-cols-2 gap-3">
            <input
              value={origem}
              onChange={(e) => setOrigem(e.target.value)}
              placeholder="Origem"
              className="p-2 border rounded"
              required
            />
            <input
              value={destino}
              onChange={(e) => setDestino(e.target.value)}
              placeholder="Destino"
              className="p-2 border rounded"
              required
            />
          </div>

          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descrição"
            className="w-full p-2 border rounded"
          />

          <select
            value={modoTransporte}
            onChange={(e) => setModoTransporte(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="CARRO">Carro</option>
            <option value="AVIAO">Avião</option>
            <option value="TREM">Trem</option>
            <option value="ONIBUS">Ônibus</option>
            <option value="NAVIO">Navio</option>
            <option value="OUTRO">Outro</option>
          </select>

          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded"
            >
              Criar
            </button>
            <button
              type="button"
              onClick={fetchViagens}
              className="px-4 py-2 bg-gray-200 rounded"
            >
              Recarregar
            </button>
          </div>
        </form>

        {error && <div className="mb-4 text-red-600">{error}</div>}

        <div>
          <h2 className="text-xl font-semibold mb-2">Lista de Viagens</h2>
          {loading ? (
            <div>Carregando...</div>
          ) : viagens.length === 0 ? (
            <div>Nenhuma viagem encontrada.</div>
          ) : (
            <ul className="space-y-3">
              {viagens.map((v) => (
                <li key={v.id} className="p-3 border rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold">
                        {v.origem} → {v.destino}
                      </div>
                      <div className="text-sm text-gray-600">
                        {v.modoTransporte}
                      </div>
                      <div className="text-gray-800">{v.descricao}</div>
                    </div>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(v.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded"
                      >
                        Excluir
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
