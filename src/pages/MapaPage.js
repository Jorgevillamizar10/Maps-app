import React, { useEffect, useContext } from "react";
import { SocketContext } from "../context/SocketContext";
import { useMapbox } from "../hooks/useMapbox";

const puntoInicial = {
	lng: -122.4725, //-> longitud
	lat: 37.801, //-> latitud
	zoom: 13.5, //-> zoom de pantalla
};

export const MapaPage = () => {
	const {
		coords,
		setRef,
		nuevoMarcador$,
		movimientoMarcador$,
		agregarMarcador,
		actualizarPosicion,
	} = useMapbox(puntoInicial);

	const { socket } = useContext(SocketContext);

	//escuchar marcadores existentes
	useEffect(() => {
		socket.on("marcadores-activos", (marcadores) => {
			for (const key of Object.keys(marcadores)) {
				agregarMarcador(marcadores[key], key);
			}
		});
	}, [socket, agregarMarcador]);

	//nuevo marcador
	useEffect(() => {
		nuevoMarcador$.subscribe((marcador) => {
			socket.emit("marcador-nuevo", marcador);
		});
	}, [nuevoMarcador$, socket]);

	//marcador en movimieto
	useEffect(() => {
		movimientoMarcador$.subscribe((marcador) => {
			socket.emit("marcador-actualizado", marcador);
		});
	}, [socket, movimientoMarcador$]);

	//mover marcador mediante sockets
	useEffect(() => {
		socket.on("marcador-actualizado", (marcador) => {
			actualizarPosicion(marcador);
		});
	}, [socket, actualizarPosicion]);

	//escuchar nuevos marcadores
	useEffect(() => {
		socket.on("marcador-nuevo", (marcador) => {
			agregarMarcador(marcador, marcador.id);
		});
	}, [socket, agregarMarcador]);

	return (
		<>
			<div className="info">
				Lng: {coords.lng} | lat: {coords.lat} | zoom: {coords.zoom}
			</div>
			<div ref={setRef} className="mapContainer" />
		</>
	);
};
