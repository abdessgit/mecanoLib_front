import './App.css'
import { useNavigate } from "react-router-dom"

function App() {

    const navigate = useNavigate()

    return (
        <div>
            <h1>Bienvenue sur MecanoLib</h1>
            <p>Page d'accueil</p>

            <button onClick={() => navigate("/inscriptionGarage")}>
                Inscription Garage
            </button>

        </div>
    )

}

export default App