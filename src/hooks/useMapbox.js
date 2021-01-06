import { useRef, useEffect, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import { v4 } from "uuid";
import { Subject } from "rxjs";

mapboxgl.accessToken =
	"pk.eyJ1Ijoiam9yZ2V2aWxsYW1pemFyMTAiLCJhIjoiY2tqZDBlb2VnMDMyYjJxcWo5YTVvM3hlaSJ9.JDhRz_8WnKMWJDfst14OiQ";

export const useMapbox = (puntoInicial) => {
	//->referencia al div del mapa
	const mapaDiv = useRef();
	const setRef = useCallback((node) => {
		mapaDiv.current = node;
	}, []);

	//referencia a los marcadores
	const marcadores = useRef({});

	//Observables de Rxjs
	const movimientoMarcador = useRef(new Subject());
	const nuevoMarcador = useRef(new Subject());

	const mapa = useRef();
	//estado para las coordenadas
	const [coords, setCoords] = useState(puntoInicial);

	//funcion para agregar amrcadores
	const agregarMarcador = useCallback((ev, id) => {
		const { lng, lat } = ev.lngLat || ev;

		const marker = new mapboxgl.Marker();
		marker.id = id ?? v4(); //-> ?? operador si el id no viene ?? usa el v4 para generarlo
		marker
			.setLngLat([lng, lat]) //-> agreagamos la latitud y longitud de donde estamos dando click en el mapa
			.addTo(mapa.current) //-> lo añadimos a nuestro mapa
			.setDraggable(true); //-> setDragable para que se pueda deslizar el marcador

		marcadores.current[marker.id] = marker; //guardando la referencia de los marcadores en un hook local

		if (!id) {
			//si el id no existe significa que no lo estoy genenarndo yo entonces ahi si lo volvemos a crear para evitar ciclos infinitos
			nuevoMarcador.current.next({
				id: marker.id,
				lat,
				lng,
			}); //emitiendo el evento
		}

		//escuchar movimientos del marcador
		//'drag' son eventos de la libreria mapbox leer en la documentacion
		marker.on("drag", ({ target }) => {
			const { id } = target;
			const { lng, lat } = target.getLngLat();

			//emitiendo el marcador en movimiento
			movimientoMarcador.current.next({
				id,
				lat,
				lng,
			});
		});
	}, []);

	//funcion para actualizar la ubicacion del marcador
	const actualizarPosicion = useCallback((marcador) => {
		//buscamos dentro del arreglo de marcadores el que tenga ese id
		marcadores.current[marcador.id].setLngLat([marcador.lng, marcador.lat]);
	}, []);

	useEffect(() => {
		const map = new mapboxgl.Map({
			container: mapaDiv.current,
			style: "mapbox://styles/mapbox/streets-v11",
			center: [puntoInicial.lng, puntoInicial.lat],
			zoom: puntoInicial.zoom,
		});

		mapa.current = map; //como usamos el useRef para usar el valor actual usamos el .current
	}, [puntoInicial]);

	//escuchando el evento cuando se mueve el mapa
	useEffect(() => {
		//cuando nos movamos en el mapa se va a disparar este callback
		mapa.current?.on("move", () => {
			const { lng, lat } = mapa.current.getCenter(); //retorna un objeto longitud y latitud donde estamos en el mapa.current, esta todo en la documentacion de mapbox
			setCoords({
				lng: lng.toFixed(4),
				lat: lat.toFixed(4), //toFixed para manejar los decimales de la longityd y latitud solo pido 4
				zoom: mapa.current.getZoom().toFixed(2),
			});
		});
	}, []);

	//Agregar marcadores cuando hacemos click
	useEffect(() => {
		mapa.current?.on("click", (ev) => {
			agregarMarcador(ev);
		});
	}, [agregarMarcador]);

	return {
		agregarMarcador,
		coords,
		setRef,
		marcadores,
		nuevoMarcador$: nuevoMarcador.current, //se le pone el simbolo de $ cuando es un observador al cual nos podemos suscribir OJO RxJs
		movimientoMarcador$: movimientoMarcador.current,
		actualizarPosicion,
	};
};
