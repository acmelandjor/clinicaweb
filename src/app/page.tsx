"use client";

import { useState, useEffect, ChangeEvent } from 'react';
import {
  UserPlus, Calendar, FileText, Timer, User, Search, Plus,
  Clock, Play, Pause, RotateCcw, LogOut
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';

// Definición de tipos
interface Paciente {
  nombre: string;
  edad: string;
  profesion: string;
  motivo_consulta: string;
  historial_medico: string;
  fecha_registro: string | Timestamp;
  search_key?: string;
}

interface Sesion {
  id: number;
  pacienteId: string;
  fecha: string;
  hora: string;
  motivo: string;
  observaciones: string;
  pacienteNombre: string;
  estado: string;
  fechaCreado?: Timestamp; // For Firestore
}

interface Revision {
  id: number;
  pacienteId: string; // Changed to string to match Firestore id_firestore
  pacienteNombre: string;
  diagnostico: string;
  tratamiento: string;
  notas: string;
  fecha: string;
  hora: string;
  fechaCreado?: Timestamp; // For Firestore
}

interface FormPaciente {
  nombre: string;
  edad: string;
  profesion: string;
  motivo_consulta: string;
  historial_medico: string;
}

interface FormSesion {
  pacienteId: string;
  fecha: string;
  hora: string;
  motivo: string;
  sintomas: string;
  diagnostico: string;
  tratamiento: string;
  puntos: string;
  lengua_cuerpo: string;
  lengua_saburra: string;
  pulso_izquierdo: string;
  pulso_derecho: string;
  observacion: string;
}

// SESIÓN PACIENTE


interface FormRevision {
  diagnostico: string;
  tratamiento: string;
  notas: string;
}

// Extender tipos para incluir ID de Firestore
interface PacienteFirestore extends Paciente {
  id_firestore: string;
}

interface SesionFirestore extends Sesion {
  id_firestore: string;
}

interface RevisionFirestore extends Revision {
  id_firestore: string;
}

interface DetalleSesion {
  id: string; // Firestore ID
  fecha: string | Timestamp;
  diagnostico: string;
  lengua_cuerpo: string;
  lengua_saburra: string;
  motivo: string;
  observacion: string;
  pulso_izquierdo: string;
  pulso_derecho: string;
  puntos: string;
  sintomas: string;
  tratamiento: string;
}

export default function ClinicaApp() {
  const { signOut, user } = useAuth();
  const [activeSection, setActiveSection] = useState<string>('registro');
  const [pacientes, setPacientes] = useState<PacienteFirestore[]>([]);
  const [sesiones, setSesiones] = useState<SesionFirestore[]>([]);
  const [revisiones, setRevisiones] = useState<RevisionFirestore[]>([]);

  // Suscripción a Firestore
  useEffect(() => {
    // Pacientes
    const qPacientes = query(collection(db, 'pacientes')); // Eliminamos orderBy temporalmente para ver todo
    const unsubscribePacientes = onSnapshot(qPacientes, (snapshot) => {
      console.log("Documentos recibidos:", snapshot.docs.length);
      const data = snapshot.docs.map(doc => {
        const item = doc.data();
        console.log("Datos del doc:", doc.id, item);
        return {
          ...item,
          id_firestore: doc.id,
          fecha_registro: item.fecha_registro?.toDate?.()?.toLocaleDateString() || item.fecha_registro || "Sin fecha"
        };
      }) as PacienteFirestore[];
      setPacientes(data);
    });

    // Sesiones
    const qSesiones = query(collection(db, 'sesiones'), orderBy('fechaCreado', 'desc'));
    const unsubscribeSesiones = onSnapshot(qSesiones, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        ...doc.data(),
        id_firestore: doc.id
      })) as SesionFirestore[];
      setSesiones(data);
    });

    // Revisiones
    const qRevisiones = query(collection(db, 'revisiones'), orderBy('fechaCreado', 'desc'));
    const unsubscribeRevisiones = onSnapshot(qRevisiones, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        ...doc.data(),
        id_firestore: doc.id
      })) as RevisionFirestore[];
      setRevisiones(data);
    });

    return () => {
      unsubscribePacientes();
      unsubscribeSesiones();
      unsubscribeRevisiones();
    };
  }, []);

  // Cronómetro
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [time, setTime] = useState<number>(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    if (isRunning) {
      interval = setInterval(() => {
        setTime(t => t + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // REGISTRO DE PACIENTES
  const RegistroPaciente = () => {
    const [form, setForm] = useState<FormPaciente>({
      nombre: '',
      edad: '',
      profesion: '',
      motivo_consulta: '',
      historial_medico: ''
    });

    const handleSubmit = async () => {
      if (form.nombre && form.edad) {
        try {
          await addDoc(collection(db, 'pacientes'), {
            ...form,
            fecha_registro: serverTimestamp(),
            search_key: form.nombre.toLowerCase()
          });

          setForm({
            nombre: '',
            edad: '',
            profesion: '',
            motivo_consulta: '',
            historial_medico: ''
          });
          alert('Paciente registrado en Firestore exitosamente');
        } catch (error) {
          console.error("Error al registrar paciente:", error);
          alert('Error al registrar paciente');
        }
      }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setForm(prev => ({ ...prev, [name]: value }));
    };

    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <UserPlus className="text-blue-600" />
          Registro de Paciente
        </h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo *</label>
              <input
                type="text"
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Edad *</label>
              <input
                type="number"
                name="edad"
                value={form.edad}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Profesión</label>
              <input
                type="text"
                name="profesion"
                value={form.profesion}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo de Consulta</label>
            <textarea
              name="motivo_consulta"
              value={form.motivo_consulta}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Historial Médico</label>
            <textarea
              name="historial_medico"
              value={form.historial_medico}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleSubmit}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Registrar Paciente
          </button>
        </div>


      </div>
    );
  };

  // SESIÓN PACIENTE
  const SesionPaciente = () => {
    const [form, setForm] = useState<FormSesion>({
      pacienteId: '',
      fecha: new Date().toISOString().split('T')[0],
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      motivo: '',
      sintomas: '',
      diagnostico: '',
      tratamiento: '',
      puntos: '',
      lengua_cuerpo: '',
      lengua_saburra: '',
      pulso_izquierdo: '',
      pulso_derecho: '',
      observacion: ''
    });

    const handleSubmit = async () => {
      if (form.pacienteId && form.fecha) {
        try {
          // Guardar en la subcolección del paciente
          await addDoc(collection(db, `pacientes/${form.pacienteId}/sesiones`), {
            ...form,
            fechaCreado: serverTimestamp()
          });

          setForm({
            pacienteId: '',
            fecha: new Date().toISOString().split('T')[0],
            hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            motivo: '',
            sintomas: '',
            diagnostico: '',
            tratamiento: '',
            puntos: '',
            lengua_cuerpo: '',
            lengua_saburra: '',
            pulso_izquierdo: '',
            pulso_derecho: '',
            observacion: ''
          });
          alert('Sesión registrada exitosamente en el historial del paciente');
        } catch (error) {
          console.error("Error al registrar sesión:", error);
          alert('Error al registrar sesión');
        }
      } else {
        alert('Por favor seleccione un paciente y una fecha');
      }
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setForm(prev => ({ ...prev, [name]: value }));
    };

    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Calendar className="text-green-600" />
          Nueva Sesión Clínica
        </h2>

        <div className="space-y-6">
          {/* Datos Generales */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Datos Generales</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Paciente *</label>
                <select
                  name="pacienteId"
                  value={form.pacienteId}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Seleccionar paciente</option>
                  {pacientes.map(p => (
                    <option key={p.id_firestore} value={p.id_firestore}>{p.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
                <input
                  type="date"
                  name="fecha"
                  value={form.fecha}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                <input
                  type="time"
                  name="hora"
                  value={form.hora}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Motivo de Consulta</label>
              <input
                type="text"
                name="motivo"
                value={form.motivo}
                onChange={handleChange}
                placeholder="Dolor lumbar, ansiedad, insomnio..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Observación Física (Lengua y Pulso) */}
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
            <h3 className="text-sm font-semibold text-amber-800 mb-3 uppercase tracking-wide">Observación Física</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lengua (Cuerpo)</label>
                <input
                  type="text"
                  name="lengua_cuerpo"
                  value={form.lengua_cuerpo}
                  onChange={handleChange}
                  placeholder="Pálida, Roja, Hinchada..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lengua (Saburra)</label>
                <input
                  type="text"
                  name="lengua_saburra"
                  value={form.lengua_saburra}
                  onChange={handleChange}
                  placeholder="Blanca, Amarilla, Espesa..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pulso Izquierdo</label>
                <input
                  type="text"
                  name="pulso_izquierdo"
                  value={form.pulso_izquierdo}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pulso Derecho</label>
                <input
                  type="text"
                  name="pulso_derecho"
                  value={form.pulso_derecho}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Síntomas y Diagnóstico */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Síntomas y Signos</label>
              <textarea
                name="sintomas"
                value={form.sintomas}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diagnóstico</label>
                <textarea
                  name="diagnostico"
                  value={form.diagnostico}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tratamiento / Técnica</label>
                <textarea
                  name="tratamiento"
                  value={form.tratamiento}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Acupuntura, Moxa, Ventosas..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Puntos Tratados</label>
              <input
                type="text"
                name="puntos"
                value={form.puntos}
                onChange={handleChange}
                placeholder="IG4, H3, E36..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones / Notas Adicionales</label>
            <textarea
              name="observacion"
              value={form.observacion}
              onChange={handleChange}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={handleSubmit}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 rounded-lg transition-colors text-lg shadow-md"
          >
            Guardar Sesión
          </button>
        </div>
      </div>
    );
  };

  // REVISIÓN PACIENTE
  const RevisionPaciente = () => {
    const [busqueda, setBusqueda] = useState<string>('');
    const [pacienteSeleccionado, setPacienteSeleccionado] = useState<PacienteFirestore | null>(null);
    const [nuevaRevision, setNuevaRevision] = useState<FormRevision>({
      diagnostico: '',
      tratamiento: '',
      notas: ''
    });

    const pacientesFiltrados = pacientes.filter(p =>
      p.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.profesion?.toLowerCase().includes(busqueda.toLowerCase())
    );

    const agregarRevision = async () => {
      if (pacienteSeleccionado && nuevaRevision.diagnostico) {
        try {
          await addDoc(collection(db, 'revisiones'), {
            ...nuevaRevision,
            pacienteId: pacienteSeleccionado.id_firestore,
            pacienteNombre: pacienteSeleccionado.nombre,
            fecha: new Date().toLocaleDateString(),
            hora: new Date().toLocaleTimeString(),
            fechaCreado: serverTimestamp()
          });

          setNuevaRevision({ diagnostico: '', tratamiento: '', notas: '' });
          alert('Revisión registrada en Firestore exitosamente');
        } catch (error) {
          console.error("Error al registrar revisión:", error);
          alert('Error al registrar revisión');
        }
      }
    };

    const [historialSesiones, setHistorialSesiones] = useState<DetalleSesion[]>([]);

    useEffect(() => {
      if (pacienteSeleccionado) {
        // Referencia a la subcolección de sesiones del paciente
        const sesionesRef = collection(db, `pacientes/${pacienteSeleccionado.id_firestore}/sesiones`);
        // Intentamos ordenar por fecha, si falla por falta de índice, Firestore lanzará error en consola
        // pero podemos manejarlo o mostrar sin orden inicialmente.
        const q = query(sesionesRef);

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const data = snapshot.docs.map(doc => {
            const item = doc.data();
            return {
              id: doc.id,
              ...item,
              // Normalizar fecha si viene como Timestamp
              fecha: item.fecha instanceof Timestamp
                ? item.fecha.toDate().toLocaleDateString()
                : item.fecha || "Sin fecha"
            } as unknown as DetalleSesion;
          });
          // Ordenar en cliente por si acaso la query falla o para asegurar orden
          data.sort((a, b) => {
            const dateA = new Date(a.fecha instanceof Timestamp ? a.fecha.toDate() : a.fecha).getTime();
            const dateB = new Date(b.fecha instanceof Timestamp ? b.fecha.toDate() : b.fecha).getTime();
            return dateB - dateA;
          });
          setHistorialSesiones(data);
        }, (error) => {
          console.error("Error al recuperar sesiones:", error);
        });

        return () => unsubscribe();
      } else {
        setHistorialSesiones([]);
      }
    }, [pacienteSeleccionado]);

    // Calcular revisiones locales si se siguen usando, o ignorar
    const revisionesPaciente = pacienteSeleccionado
      ? revisiones.filter(r => r.pacienteId === pacienteSeleccionado.id_firestore)
      : [];

    const handleRevisionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setNuevaRevision(prev => ({ ...prev, [name]: value }));
    };

    const [verFicha, setVerFicha] = useState<boolean>(false);

    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <FileText className="text-purple-600" />
          Historial Clínico
        </h2>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Buscar Paciente</label>
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              value={busqueda}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setBusqueda(e.target.value)}
              placeholder="Nombre, apellido o RUT..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {busqueda && pacientesFiltrados.length > 0 && (
          <div className="mb-6 space-y-2">
            {pacientesFiltrados.map(p => (
              <div
                key={p.id_firestore}
                onClick={() => {
                  setPacienteSeleccionado(p);
                  setBusqueda('');
                  setVerFicha(false);
                }}
                className="p-4 border border-gray-200 rounded-lg hover:bg-purple-50 cursor-pointer transition-colors"
              >
                <p className="font-semibold text-gray-800">{p.nombre}</p>
                <p className="text-sm text-gray-600">Edad: {p.edad} años</p>
              </div>
            ))}
          </div>
        )}

        {pacienteSeleccionado && (
          <div className="border-t pt-6">
            <div className="bg-purple-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold text-lg text-gray-800">
                  {pacienteSeleccionado.nombre}
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setVerFicha(!verFicha)}
                    className="text-sm bg-white border border-purple-200 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-100 transition-colors"
                  >
                    {verFicha ? 'Ocultar Ficha' : 'Ver Ficha de Ingreso'}
                  </button>
                  <button
                    onClick={() => setPacienteSeleccionado(null)}
                    className="text-gray-500 hover:text-gray-700 px-2"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {verFicha && (
                <div className="mt-4 pt-4 border-t border-purple-100 grid grid-cols-2 gap-4 text-sm text-gray-600 animate-in fade-in slide-in-from-top-2 duration-200">
                  <p><span className="font-medium">Edad:</span> {pacienteSeleccionado.edad} años</p>
                  <p><span className="font-medium">Profesión:</span> {pacienteSeleccionado.profesion}</p>
                  <p className="col-span-2"><span className="font-medium">Motivo Consulta:</span> {pacienteSeleccionado.motivo_consulta}</p>
                  <p className="col-span-2"><span className="font-medium">Historial:</span> {pacienteSeleccionado.historial_medico}</p>
                  <p className="col-span-2 text-xs text-gray-500 mt-1">Registrado el: {
                    typeof pacienteSeleccionado.fecha_registro === 'string'
                      ? pacienteSeleccionado.fecha_registro
                      : "Sin fecha"
                  }</p>
                </div>
              )}
            </div>

            {/* LISTA DE SESIONES RECUPERADAS */}
            <div className="pt-2">
              <h4 className="font-semibold text-gray-800 mb-4 flex items-center justify-between">
                <span>Historial de Sesiones ({historialSesiones.length})</span>
                <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  Colección: pacientes/{pacienteSeleccionado.id_firestore}/sesiones
                </span>
              </h4>
              <div className="space-y-4">
                {historialSesiones.length === 0 ? (
                  <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    No se encontraron sesiones registradas para este paciente.
                  </p>
                ) : (
                  historialSesiones.map(sesion => (
                    <div key={sesion.id} className="border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                        <span className="font-semibold text-gray-700 flex items-center gap-2">
                          <Calendar size={16} className="text-purple-600" />
                          {typeof sesion.fecha === 'string' ? sesion.fecha : 'Fecha inválida'}
                        </span>
                        {sesion.diagnostico && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full truncate max-w-[200px]">
                            {sesion.diagnostico}
                          </span>
                        )}
                      </div>
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">

                        <div className="space-y-2">
                          <div className="bg-blue-50 p-2 rounded-lg">
                            <p className="text-xs font-bold text-blue-700 uppercase mb-1">Motivo & Síntomas</p>
                            <p className="mb-1"><span className="font-medium">Motivo:</span> {sesion.motivo}</p>
                            <p><span className="font-medium">Síntomas:</span> {sesion.sintomas}</p>
                          </div>

                          <div className="bg-green-50 p-2 rounded-lg">
                            <p className="text-xs font-bold text-green-700 uppercase mb-1">Diagnóstico & Tratamiento</p>
                            <p className="mb-1"><span className="font-medium">Diag:</span> {sesion.diagnostico}</p>
                            <p className="mb-1"><span className="font-medium">Puntos:</span> {sesion.puntos}</p>
                            <p><span className="font-medium">Tratamiento:</span> {sesion.tratamiento}</p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="bg-amber-50 p-2 rounded-lg">
                            <p className="text-xs font-bold text-amber-700 uppercase mb-1">Observación Física</p>
                            <div className="grid grid-cols-2 gap-2">
                              <p><span className="font-medium">Lengua/Cuerpo:</span> {sesion.lengua_cuerpo}</p>
                              <p><span className="font-medium">Saburra:</span> {sesion.lengua_saburra}</p>
                              <p><span className="font-medium">Pulso Izq:</span> {sesion.pulso_izquierdo}</p>
                              <p><span className="font-medium">Pulso Der:</span> {sesion.pulso_derecho}</p>
                            </div>
                          </div>

                          {sesion.observacion && (
                            <div className="bg-gray-50 p-2 rounded-lg">
                              <p className="text-xs font-bold text-gray-700 uppercase mb-1">Notas Adicionales</p>
                              <p>{sesion.observacion}</p>
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // CRONÓMETRO
  const Cronometro = () => {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <Timer className="text-red-600" />
          Cronómetro de Sesión
        </h2>

        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-7xl font-bold text-gray-800 mb-8 font-mono">
            {formatTime(time)}
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`flex items-center gap-2 px-8 py-4 rounded-lg font-semibold text-white transition-colors ${isRunning
                ? 'bg-yellow-500 hover:bg-yellow-600'
                : 'bg-green-600 hover:bg-green-700'
                }`}
            >
              {isRunning ? (
                <>
                  <Pause size={24} />
                  Pausar
                </>
              ) : (
                <>
                  <Play size={24} />
                  Iniciar
                </>
              )}
            </button>

            <button
              onClick={() => {
                setTime(0);
                setIsRunning(false);
              }}
              className="flex items-center gap-2 px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
            >
              <RotateCcw size={24} />
              Reiniciar
            </button>
          </div>

          <div className="mt-12 w-full max-w-md">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Información</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Use este cronómetro para medir la duración de las sesiones</p>
                <p>• El tiempo se registra en formato HH:MM:SS</p>
                <p>• Puede pausar y reanudar según sea necesario</p>
                <p>• Útil para control de tiempo en terapias y consultas</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Sistema Clínica Liányī 漣漪</h1>
            <p className="text-gray-600">Gestión integral de pacientes</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden md:block">{user?.email}</span>
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto py-3">
            <button
              onClick={() => setActiveSection('registro')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${activeSection === 'registro'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <UserPlus size={20} />
              Registro Paciente
            </button>
            <button
              onClick={() => setActiveSection('sesion')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${activeSection === 'sesion'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <Calendar size={20} />
              Sesión Paciente
            </button>
            <button
              onClick={() => setActiveSection('revision')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${activeSection === 'revision'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <FileText size={20} />
              Revisión Paciente
            </button>
            <button
              onClick={() => setActiveSection('cronometro')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors whitespace-nowrap ${activeSection === 'cronometro'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              <Timer size={20} />
              Cronómetro
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {activeSection === 'registro' && <RegistroPaciente />}
        {activeSection === 'sesion' && <SesionPaciente />}
        {activeSection === 'revision' && <RevisionPaciente />}
        {activeSection === 'cronometro' && <Cronometro />}
      </main>

      {/* Footer */}
      <footer className="bg-white mt-12 py-6 border-t">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>© 2025 Sistema Clínica Médica - Gestión Profesional de Pacientes</p>
        </div>
      </footer>
    </div>
  );
}