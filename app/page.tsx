"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  Shield,
  LogOut,
  Users,
  FileText,
  Euro,
  Download,
  Calendar,
  Activity,
  Plus,
  Edit,
  Trash2,
  Info,
  History,
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { usePagination } from "@/hooks/use-pagination"
import { useSearchFilter } from "@/hooks/use-search-filter"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GlobalSearch } from "@/components/global-search"
import { MobileCard } from "@/components/mobile-card"
import { EmployeeHistoryModal } from "@/components/employee-history-modal"
import { ConsultationInfo } from "@/components/consultation-info"
import { ReportModal } from "@/components/report-modal"
import { ConsultationForm } from "@/components/consultation-form"
import { db, firebaseConfig } from "@/lib/firebase"
import { initializeApp, getApp, getApps, deleteApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  inMemoryPersistence,
  createUserWithEmailAndPassword,
  signOut
} from "firebase/auth";
import {
  collection,
  onSnapshot,
  where,
  addDoc,
  updateDoc,
  setDoc,
  deleteDoc,
  doc,
} from "firebase/firestore"
import { useAuth } from "@/hooks/AuthContext"
import { TablePagination } from "@/hooks/TablePagination"

export default function HomePage() {
  const [employeesList, setEmployeesList] = useState<any[]>([])
  const [doctorsList, setDoctorsList] = useState<any[]>([])
  const [consultationsList, setConsultationsList] = useState<any[]>([])
  const [usersList, setUsersList] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("consultations")
  const [editingItem, setEditingItem] = useState<any>(null)
  const [deletingItem, setDeletingItem] = useState<any>(null)
  const [isNewItemOpen, setIsNewItemOpen] = useState(false)
  const [selectedEmployeeHistory, setSelectedEmployeeHistory] = useState<any>(null)
  const [selectedConsultation, setSelectedConsultation] = useState<any>(null)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false)
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const { user, logout } = useAuth()

  const filterConfigs = {
    consultations: {
      searchFields: ["employeId", "employeNom", "medicinNom", "medecinId", "employeMatricule"],
      filterOptions: {
        medecinId: {
          label: "Médecin",
          options: doctorsList.map((doc) => ({ value: doc.id, label: `${doc.nom} ${doc.prenom}` })),
        },
        "repos.accorde": {
          label: "Repos",
          options: [
            { value: "true", label: "Accordé" },
            { value: "false", label: "Non accordé" },
          ],
        },
        lieu: {
          label: "Lieu",
          options: [
            { value: "Cabinet", label: "Cabinet" },
            { value: "Port", label: "Port" },
          ],
        },
      },
    },
    employees: {
      searchFields: ["nom", "prenom", "matricule"],
      filterOptions: {
        civilite: {
          label: "Civilité",
          options: [
            { value: "Monsieur", label: "Monsieur" },
            { value: "Madame", label: "Madame" },
            { value: "Mademoiselle", label: "Mademoiselle" },
          ],
        },
      },
    },
    doctors: {
      searchFields: ["nom", "prenom", "specialite", "telephone"],
      filterOptions: {
        specialite: {
          label: "Spécialité",
          options: [...new Set(doctorsList.map((doc) => doc.specialite))].map((spec) => ({
            value: spec,
            label: spec,
          })),
        },
        role: {
          label: "Rôle",
          options: [
            { value: "medecin", label: "Médecin" },
            { value: "infirmier", label: "Infirmier" }
          ],
        },
      },
    },
    users: {
      searchFields: ["nom", "prenom", "email"],
      filterOptions: {
        role: {
          label: "Rôle",
          options: [
            { value: "admin", label: "Administrateur" },
            { value: "user", label: "Utilisateur" },
          ],
        },
      },
    },
  }

  useEffect(() => {
    const unsubEmployees = onSnapshot(collection(db, "employees"), (snapshot) => {
      setEmployeesList(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    const unsubDoctors = onSnapshot(collection(db, "doctors"), (snapshot) => {
      setDoctorsList(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    const unsubConsultations = onSnapshot(collection(db, "consultations"), (snapshot) => {
      setConsultationsList(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    // 🔹 Récupérer les utilisateurs sauf current user
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      setUsersList(snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((u) => u.id !== user?.uid)); // Exclure l'utilisateur actuel
    });

    return () => {
      unsubEmployees();
      unsubDoctors();
      unsubConsultations();
      unsubUsers();
    };
  }, []);

  const handleAddConsultation = async (newConsultation: any) => {
    setIsLoading(true)
    if (!newConsultation.employeId) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez sélectionner un employé pour la consultation.",
      });
      setIsLoading(false)
      return;
    }

    if (!newConsultation.medecinId) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez sélectionner un médecin pour la consultation.",
      });
      setIsLoading(false)
      return;
    }
    if (!newConsultation.lieu) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez sélectionner un lieu pour la consultation.",
      });
      setIsLoading(false)
      return;
    }
    if (newConsultation.repos.accorde && (!newConsultation.repos.duree || !newConsultation.repos.dateDebut || !newConsultation.repos.dateFin || newConsultation.repos.dateDebut >= newConsultation.repos.dateFin || !newConsultation.repos.motif)) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez remplir tous les champs requis pour le repos accordé.",
      });
      setIsLoading(false)
      return;
    }

    try {
      await addDoc(collection(db, "consultations"), newConsultation);
      toast({
        variant: "success",
        title: "Consultation ajoutée",
        description: "La consultation a été ajoutée avec succès.",
      });
      setIsNewItemOpen(false)
      setEditingItem(null)
      setIsLoading(false)
    } catch (error) {
      console.error("Error adding consultation: ", error)
      setIsLoading(false)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout de la consultation.",
      });
    }
  }

  const handleUpdateConsultation = async (updatedConsultation: any) => {
    setIsLoading(true)
    if (!updatedConsultation.employeId) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez sélectionner un employé pour la consultation.",
      });
      setIsLoading(false)
      return;
    }
    if (!updatedConsultation.medecinId) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez sélectionner un médecin pour la consultation.",
      });
      setIsLoading(false)
      return;
    }
    if (!updatedConsultation.lieu) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez sélectionner un lieu pour la consultation.",
      });
      setIsLoading(false)
      return;
    }
    if (updatedConsultation.repos.accorde && (!updatedConsultation.repos.duree || !updatedConsultation.repos.dateDebut || !updatedConsultation.repos.dateFin || updatedConsultation.repos.dateDebut >= updatedConsultation.repos.dateFin || !updatedConsultation.repos.motif)) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Veuillez remplir tous les champs requis pour le repos accordé.",
      });
      setIsLoading(false)
      return;
    }
    try {
      const docRef = doc(db, "consultations", updatedConsultation.id);
      await updateDoc(docRef, updatedConsultation);
      setConsultationsList((prev) =>
        prev.map((c) => (c.id === updatedConsultation.id ? { ...c, ...updatedConsultation } : c))
      );
      toast({
        variant: "warning",
        title: "Consultation mise à jour",
        description: "La consultation a été mise à jour avec succès.",
      });
      setIsNewItemOpen(false)
      setEditingItem(null)
      setIsLoading(false)
    } catch (error) {
      console.error("Error updating consultation: ", error);
      setIsLoading(false)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour de la consultation.",
      });
    }
  }

  const handleAddEmployee = async (newEmployee: any) => {
    setIsLoading(true)
    const existingEmployee = employeesList.find((emp) => emp.matricule === newEmployee.matricule);
    if (existingEmployee) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Un employé avec ce matricule existe déjà.",
      });
      setIsLoading(false)
      return;
    }
    try {
      await addDoc(collection(db, "employees"), newEmployee);
      toast({
        variant: "success",
        title: "Employé ajouté",
        description: "L'employé a été ajouté avec succès.",
      });
      setIsNewItemOpen(false)
      setEditingItem(null)
      setIsLoading(false)
    } catch (error) {
      console.error("Error adding employee: ", error);
      setIsLoading(false)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout de l'employé.",
      });
    }
  }
  const handleUpdateEmployee = async (updatedEmployee: any) => {
    setIsLoading(true)
    const existingEmployee = employeesList.find((emp) => emp.matricule === updatedEmployee.matricule && emp.id !== updatedEmployee.id);
    if (existingEmployee) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Un employé avec ce matricule existe déjà.",
      });
      setIsLoading(false)
      return;
    }
    try {
      const docRef = doc(db, "employees", updatedEmployee.id);
      await updateDoc(docRef, updatedEmployee);
      setEmployeesList((prev) =>
        prev.map((e) => (e.id === updatedEmployee.id ? { ...e, ...updatedEmployee } : e))
      );
      toast({
        variant: "warning",
        title: "Employé mis à jour",
        description: "L'employé a été mis à jour avec succès.",
      });
      setIsNewItemOpen(false)
      setEditingItem(null)
      setIsLoading(false)
    } catch (error) {
      console.error("Error updating employee: ", error);
      setIsLoading(false)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour de l'employé.",
      });
    }
  }

  const handleAddDoctor = async (newDoctor: any) => {
    setIsLoading(true)
    const existingDoctor = doctorsList.find((doc) => doc.telephone === newDoctor.telephone);
    if (existingDoctor) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Un médecin avec ce numéro de téléphone existe déjà.",
      });
      setIsLoading(false)
      return;
    }
    try {
      await addDoc(collection(db, "doctors"), newDoctor);
      toast({
        variant: "success",
        title: "Médecin ajouté",
        description: "Le médecin a été ajouté avec succès.",
      });
      setIsNewItemOpen(false)
      setEditingItem(null)
      setIsLoading(false)
    } catch (error) {
      console.error("Error adding doctor: ", error);
      setIsLoading(false)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout du médecin.",
      });
    }
  }

  const handleUpdateDoctor = async (updatedDoctor: any) => {
    setIsLoading(true)
    const existingDoctor = doctorsList.find((doc) => doc.telephone === updatedDoctor.telephone && doc.id !== updatedDoctor.id);
    if (existingDoctor) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Un médecin avec ce numéro de téléphone existe déjà.",
      });
      setIsLoading(false)
      return;
    }
    try {
      const docRef = doc(db, "doctors", updatedDoctor.id);
      await updateDoc(docRef, updatedDoctor);
      setDoctorsList((prev) =>
        prev.map((d) => (d.id === updatedDoctor.id ? { ...d, ...updatedDoctor } : d))
      );
      toast({
        variant: "warning",
        title: "Médecin mis à jour",
        description: "Le médecin a été mis à jour avec succès.",
      });
      setIsNewItemOpen(false)
      setEditingItem(null)
      setIsLoading(false)
    } catch (error) {
      console.error("Error updating doctor: ", error);
      setIsLoading(false)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du médecin.",
      });
    }
  }

  const handleAddUser = async (newUser: any) => {
    setIsLoading(true)
    const existingUser = usersList.find((user) => user.email === newUser.email);
    if (existingUser) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Un utilisateur avec cet email existe déjà.",
      });
      setIsLoading(false)
      return;
    }
    if (newUser.password !== newUser.repassword) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas.",
      });
      setIsLoading(false)
      return;
    }
    try {
      let secondaryApp;
      try {
        secondaryApp = getApp("Secondary");
      } catch {
        secondaryApp = initializeApp(firebaseConfig, "Secondary");
      }
      const secondaryAuth = getAuth(secondaryApp);

      await setPersistence(secondaryAuth, inMemoryPersistence);

      const userCredential = await createUserWithEmailAndPassword(
        secondaryAuth,
        newUser.email,
        newUser.password
      );
      const uid = userCredential.user.uid;

      await setDoc(doc(db, "users", uid), {
        email: newUser.email,
        nom: newUser.nom,
        prenom: newUser.prenom,
        role: newUser.role,
        createdAt: new Date(),
      });

      toast({
        variant: "success",
        title: "Utilisateur ajouté",
        description: "L'utilisateur a été créé avec succès.",
      });

      await signOut(secondaryAuth);
      await deleteApp(secondaryApp);

      setIsNewItemOpen(false);
      setEditingItem(null);
    } catch (error: any) {
      console.error("Error adding user: ", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de l'ajout de l'utilisateur.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleUpdateUser = async (updatedUser: any) => {
    setIsLoading(true)
    const existingUser = usersList.find((user) => user.email === updatedUser.email && user.id !== updatedUser.id);
    if (existingUser) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Un utilisateur avec cet email existe déjà.",
      });
      setIsLoading(false)
      return;
    }
    try {
      const docRef = doc(db, "users", updatedUser.id);
      await updateDoc(docRef, {
        email: updatedUser.email,
        nom: updatedUser.nom,
        prenom: updatedUser.prenom,
        role: updatedUser.role,
      });
      setUsersList((prev) =>
        prev.map((u) => (u.id === updatedUser.id ? { ...u, ...updatedUser } : u))
      );
      toast({
        variant: "warning",
        title: "Utilisateur mis à jour",
        description: "L'utilisateur a été mis à jour avec succès.",
      });
      setIsNewItemOpen(false)
      setEditingItem(null)
      setIsLoading(false)
    } catch (error) {
      console.error("Error updating user: ", error);
      setIsLoading(false)
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour de l'utilisateur.",
      });
    }
  }

  const consultationsSearch = useSearchFilter({
    data: consultationsList,
    ...filterConfigs.consultations,
  })

  const employeesSearch = useSearchFilter({
    data: employeesList,
    ...filterConfigs.employees,
  })

  const doctorsSearch = useSearchFilter({
    data: doctorsList,
    ...filterConfigs.doctors,
  })

  const usersSearch = useSearchFilter({
    data: usersList,
    ...filterConfigs.users,
  })

  const consultationsPagination = usePagination({
    data: consultationsSearch.filteredData,
  })

  const employeesPagination = usePagination({
    data: employeesSearch.filteredData,
  })

  const doctorsPagination = usePagination({
    data: doctorsSearch.filteredData,
  })

  const usersPagination = usePagination({
    data: usersSearch.filteredData,
  })

  const handleLogout = () => {
    logout()
    toast({
      variant: "success",
      title: "Déconnexion réussie",
      description: "Vous avez été déconnecté avec succès.",
    })
  }

  const openReportModal = () => {
    setIsReportModalOpen(true)
  }

  const openInvoiceModal = () => {
    setIsInvoiceModalOpen(true)
  }

  const handleDelete = (type: string, id: string) => {
    switch (type) {
      case "employee":
        const employeeDocRef = doc(db, "employees", id)
        deleteDoc(employeeDocRef)
        toast({
          variant: "destructive",
          title: "Employé supprimé",
          description: "L'employé a été supprimé avec succès.",
        })
        break
      case "doctor":
        const doctorDocRef = doc(db, "doctors", id)
        deleteDoc(doctorDocRef)
        toast({
          variant: "destructive",
          title: "Médecin supprimé",
          description: "Le médecin a été supprimé avec succès.",
        })
        break
      case "consultation":
        const consultationDocRef = doc(db, "consultations", id)
        deleteDoc(consultationDocRef)
        toast({
          variant: "destructive",
          title: "Consultation supprimée",
          description: "La consultation a été supprimée avec succès.",
        })
        break
      case "user":
        const userDocRef = doc(db, "users", id)
        deleteDoc(userDocRef)
        toast({
          variant: "destructive",
          title: "Utilisateur supprimé",
          description: "L'utilisateur a été supprimé avec succès.",
        })
        break
    }
    setDeletingItem(null)
  }

  if (!user) return null

  const reposAccordes = consultationsList.filter((c) => c.repos.accorde).length

  const formatCivilite = (civilite: string) => {
    switch (civilite) {
      case "Monsieur":
        return "M."
      case "Madame":
        return "Mme"
      case "Mademoiselle":
        return "Mlle"
      default:
        return civilite
    }
  }

  const isAdmin = user.role === "admin"

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div className="flex items-center min-w-0">
              <div className="bg-green-600 p-2 rounded-lg mr-2 sm:mr-3 flex-shrink-0">
                <Shield className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">Administration Cabinet</h1>
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  Bienvenue, {user.nom} {user.prenom}
                </p>
              </div>
            </div>
            <Button onClick={() => setIsLogoutDialogOpen(true)} variant="outline" size="sm" className="flex-shrink-0 bg-transparent">
              <LogOut className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Déconnexion</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Employés</CardTitle>
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{employeesList.length}</div>
              <p className="text-xs text-muted-foreground">Société TCN</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Consultations</CardTitle>
              <Activity className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{consultationsList.length}</div>
              <p className="text-xs text-muted-foreground">Toutes les consultations</p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Medecins</CardTitle>
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{doctorsList.length}</div>
              <p className="text-xs text-muted-foreground">
                Tous les médecins
              </p>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Repos accordés</CardTitle>
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{reposAccordes}</div>
              <p className="text-xs text-muted-foreground">
                Tous les repos accordés
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center text-base sm:text-lg">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 mr-3" />
                Rapport Hebdomadaire
              </CardTitle>
              <CardDescription className="text-sm">
                Générer et télécharger le rapport hebdomadaire pour TCN
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={openReportModal} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Télécharger le rapport PDF
              </Button>
            </CardContent>
          </Card>
          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
            <CardHeader>
              <CardTitle className="flex items-center text-base sm:text-lg">
                <Euro className="h-4 w-4 sm:h-5 sm:w-5 mr-3" />
                Facture Mensuelle
              </CardTitle>
              <CardDescription className="text-sm">
                Générer et télécharger la facture mensuelle pour TCN
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={openInvoiceModal} className="w-full" disabled={!isAdmin}>
                <Download className="h-4 w-4 mr-2" />
                Télécharger la facture PDF
              </Button>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="overflow-x-auto">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-4">
              <TabsTrigger value="consultations" className="text-xs sm:text-sm">
                Consultations
              </TabsTrigger>
              <TabsTrigger value="employees" className="text-xs sm:text-sm">
                Employés
              </TabsTrigger>
              <TabsTrigger value="doctors" className="text-xs sm:text-sm">
                Médecins
              </TabsTrigger>
              <TabsTrigger value="users" className="text-xs sm:text-sm">
                Utilisateurs
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="consultations">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div>
                    <CardTitle>Toutes les consultations</CardTitle>
                    <CardDescription>Liste complète des consultations effectuées</CardDescription>
                  </div>
                  <Dialog
                    open={isNewItemOpen && activeTab === "consultations"}
                    onOpenChange={(open) => {
                      setIsNewItemOpen(open)
                      if (!open) setEditingItem(null)
                    }}
                    modal={false}
                  >
                    <DialogTrigger asChild>
                      <Button className="w-full sm:w-auto">
                        <Plus className="h-4 w-4 mr-2" />
                        Nouvelle Consultation
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl h-full overflow-y-auto sm:max-h-[90vh]">
                      <DialogHeader>
                        <DialogTitle>{editingItem ? "Modifier Consultation" : "Ajouter Consultation"}</DialogTitle>
                        <DialogDescription>{editingItem ? "Modifier les détails de la consultation." : "Ajouter une nouvelle consultation."}</DialogDescription>
                      </DialogHeader>
                      <ConsultationForm
                        isLoading={isLoading}
                        consultation={editingItem}
                        onClose={() => {
                          setIsNewItemOpen(false)
                          setEditingItem(null)
                        }}
                        onSave={(newItem) => {
                          if (editingItem) {
                            handleUpdateConsultation(newItem)
                          } else {
                            handleAddConsultation(newItem)
                          }
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <GlobalSearch
                  searchTerm={consultationsSearch.searchTerm}
                  onSearchChange={consultationsSearch.setSearchTerm}
                  filters={consultationsSearch.filters}
                  onFilterChange={consultationsSearch.updateFilter}
                  onClearFilters={consultationsSearch.clearFilters}
                  filterOptions={filterConfigs.consultations.filterOptions}
                  placeholder="Rechercher par matricule, nom ou prénom"
                />

                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="max-w-[80px]">Date</TableHead>
                        <TableHead className="max-w-[80px]">Matricule</TableHead>
                        <TableHead className="max-w-[120px]">Employé</TableHead>
                        <TableHead className="max-w-[100px]">Médecin</TableHead>
                        <TableHead className="max-w-[80px]">Lieu</TableHead>
                        <TableHead className="max-w-[120px]">Diagnostic</TableHead>
                        <TableHead className="max-w-[80px]">Traitement</TableHead>
                        <TableHead className="max-w-[80px]">Repos</TableHead>
                        <TableHead className="min-w-[80px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {consultationsPagination.paginatedData.map((consultation) => {
                        return (
                          <TableRow key={consultation.id}>
                            <TableCell className="font-medium">
                              <Badge variant="secondary" className="text-xs bg-blue-50 text-blue-700">
                                {new Date(consultation.date).toLocaleDateString("fr-FR")}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {consultation?.employeMatricule || "Inconnu"}
                            </TableCell>
                            <TableCell className="max-w-[120px] truncate">
                              {consultation?.employeNom}
                            </TableCell>
                            <TableCell>{consultation?.medicinNom}</TableCell>
                            <TableCell className="max-w-[80px]">
                              {consultation.lieu || "N/A"}
                            </TableCell>
                            <TableCell className="max-w-[120px] truncate">
                              {consultation.diagnostic || "N/A"}
                            </TableCell>
                            <TableCell className="max-w-[80px] truncate">
                              {consultation.traitement || "N/A"}
                            </TableCell>
                            <TableCell>
                              {consultation.repos.accorde ? (
                                <Badge variant="secondary" className="text-xs bg-green-50 text-green-700">{consultation.repos.duree} jour(s)</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs bg-red-50 text-red-700">
                                  Non
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedConsultation(consultation)
                                  }}
                                >
                                  <Info className="h-4 w-4 text-purple-500" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingItem(consultation)
                                    setIsNewItemOpen(true)
                                  }}
                                >
                                  <Edit className="h-4 w-4 text-blue-500" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeletingItem({ type: "consultation", item: consultation })}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                      {consultationsPagination.paginatedData.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground">
                            Aucune consultation trouvée
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="md:hidden space-y-4">
                  {consultationsPagination.paginatedData.map((consultation) => {
                    return (
                      <MobileCard
                        key={consultation.id}
                        title={consultation.employeNom || "Inconnu"}
                        subtitle={new Date(consultation.date).toLocaleDateString("fr-FR")}
                        content={[
                          { label: "Matricule", value: consultation.employeMatricule || "Inconnu" },
                          { label: "Médecin", value: `${consultation.medicinNom}` },
                          { label: "Lieu", value: consultation.lieu || "N/A" },
                          { label: "Diagnostic", value: consultation.diagnostic || "N/A" },
                          { label: "Traitement", value: consultation.traitement || "N/A" },
                          {
                            label: "Repos",
                            value: consultation.repos.accorde ? `${consultation.repos.duree} jour(s)` : "Non",
                            type: "badge",
                          },
                        ]}
                        actions={{
                          onView: () => {
                            setSelectedConsultation(consultation)
                          },
                          onEdit: () => {
                            setEditingItem(consultation)
                            setIsNewItemOpen(true)
                          },
                          onDelete: () => setDeletingItem({ type: "consultation", item: consultation }),
                        }}
                      />
                    )
                  })}
                  {consultationsPagination.paginatedData.length === 0 && (
                    <div className="text-center text-muted-foreground">
                      Aucune consultation trouvée
                    </div>
                  )}
                </div>
                {consultationsSearch.filteredData.length > consultationsPagination.itemsPerPage && (
                <TablePagination
                  pagination={consultationsPagination}
                  totalRows={consultationsSearch.filteredData.length}
                />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employees">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div>
                    <CardTitle>Employés TCN</CardTitle>
                    <CardDescription>Liste des employés de la société TCN</CardDescription>
                  </div>
                  <Dialog
                    open={isNewItemOpen && activeTab === "employees"}
                    onOpenChange={(open) => {
                      setIsNewItemOpen(open)
                      if (!open) setEditingItem(null)
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button className="w-full sm:w-auto">
                        <Plus className="h-4 w-4 mr-2" />
                        Nouvel Employé
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl h-full overflow-y-auto sm:max-h-[90vh]">
                      <DialogHeader>
                        <DialogTitle>{editingItem ? "Modifier" : "Nouvel"} Employé</DialogTitle>
                        <DialogDescription>
                          {editingItem ? "Modifier les informations de l'employé" : "Ajouter un nouvel employé"}
                        </DialogDescription>
                      </DialogHeader>
                      <EmployeeForm
                        isLoading={isLoading}
                        employee={editingItem}
                        onClose={() => {
                          setIsNewItemOpen(false)
                          setEditingItem(null)
                        }}
                        onSave={(item) => {
                          if (editingItem) {
                            handleUpdateEmployee(item)
                          } else {
                            handleAddEmployee(item)
                          }
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <GlobalSearch
                  searchTerm={employeesSearch.searchTerm}
                  onSearchChange={employeesSearch.setSearchTerm}
                  filters={employeesSearch.filters}
                  onFilterChange={employeesSearch.updateFilter}
                  onClearFilters={employeesSearch.clearFilters}
                  filterOptions={filterConfigs.employees.filterOptions}
                  placeholder="Rechercher par matricule, nom ou prénom"
                />

                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Matricule</TableHead>
                        <TableHead className="min-w-[120px]">Nom</TableHead>
                        <TableHead className="min-w-[160px]">Intitulé unité</TableHead>
                        <TableHead className="min-w-[180px]">Emploi occupé</TableHead>
                        <TableHead className="min-w-[180px]">Intitulé département</TableHead>
                        <TableHead>Civilité</TableHead>
                        <TableHead className="min-w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employeesPagination.paginatedData.map((employee) => {
                        return (
                          <TableRow key={employee.id}>
                            <TableCell className="font-medium">{employee.matricule}</TableCell>
                            <TableCell className="max-w-[120px] truncate">
                              {employee.prenom} {employee.nom}
                            </TableCell>
                            <TableCell className="max-w-[160px] truncate">{employee.intituleUnite}</TableCell>
                            <TableCell className="max-w-[180px] truncate">{employee.emploiOccupe}</TableCell>
                            <TableCell className="max-w-[180px] truncate">{employee.intituleDepartement}</TableCell>
                            <TableCell className="max-w-[50px]">
                              <Badge variant="outline">{formatCivilite(employee.civilite)}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedEmployeeHistory(employee)}
                                  title="Voir l'historique"
                                >
                                  <History className="h-4 w-4 text-purple-500" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingItem(employee)
                                    setIsNewItemOpen(true)
                                  }}
                                >
                                  <Edit className="h-4 w-4 text-blue-500" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeletingItem({ type: "employee", item: employee })}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                      {employeesPagination.paginatedData.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground">
                            Aucun employé trouvé
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="md:hidden space-y-4">
                  {employeesPagination.paginatedData.map((employee) => {
                    return (
                      <MobileCard
                        key={employee.id}
                        title={`${employee.prenom} ${employee.nom}`}
                        subtitle={`${employee.matricule}`}
                        content={[
                          { label: "Intitulé unité", value: employee.intituleUnite },
                          { label: "Emploi Occupé", value: employee.emploiOccupe },
                          { label: "Intitulé département", value: employee.intituleDepartement },
                        ]}
                        badge={{ text: employee.civilite, variant: "outline" }}
                        actions={{
                          onView: () => setSelectedEmployeeHistory(employee),
                          onEdit: () => {
                            setEditingItem(employee)
                            setIsNewItemOpen(true)
                          },
                          onDelete: () => setDeletingItem({ type: "employee", item: employee }),
                        }}
                      />
                    )
                  })}
                  {employeesPagination.paginatedData.length === 0 && (
                    <div className="text-center text-muted-foreground">
                      Aucun employé trouvé
                    </div>
                  )}
                </div>
                {employeesSearch.filteredData.length > employeesPagination.itemsPerPage && (
                <TablePagination
                  pagination={employeesPagination}
                  totalRows={employeesSearch.filteredData.length}
                />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="doctors">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div>
                    <CardTitle>Médecins du Cabinet</CardTitle>
                    <CardDescription>Liste des médecins du cabinet médical</CardDescription>
                  </div>
                  <Dialog
                    open={isNewItemOpen && activeTab === "doctors"}
                    onOpenChange={(open) => {
                      setIsNewItemOpen(open)
                      if (!open) setEditingItem(null)
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button className="w-full sm:w-auto">
                        <Plus className="h-4 w-4 mr-2" />
                        Nouveau Médecin
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl h-full overflow-y-auto sm:max-h-[90vh]">
                      <DialogHeader>
                        <DialogTitle>{editingItem ? "Modifier" : "Nouveau"} Médecin</DialogTitle>
                        <DialogDescription>
                          {editingItem ? "Modifier les informations du médecin" : "Ajouter un nouveau médecin"}
                        </DialogDescription>
                      </DialogHeader>
                      <DoctorForm
                        isLoading={isLoading}
                        doctor={editingItem}
                        onClose={() => {
                          setIsNewItemOpen(false)
                          setEditingItem(null)
                        }}
                        onSave={(item) => {
                          if (editingItem) {
                            handleUpdateDoctor(item)
                          } else {
                            handleAddDoctor(item)
                          }
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <GlobalSearch
                  searchTerm={doctorsSearch.searchTerm}
                  onSearchChange={doctorsSearch.setSearchTerm}
                  filters={doctorsSearch.filters}
                  onFilterChange={doctorsSearch.updateFilter}
                  onClearFilters={doctorsSearch.clearFilters}
                  filterOptions={filterConfigs.doctors.filterOptions}
                  placeholder="Rechercher par nom, prénom, spécialité ou email..."
                />

                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Prénom</TableHead>
                        <TableHead>Nom</TableHead>
                        <TableHead>Spécialité</TableHead>
                        <TableHead>Téléphone</TableHead>
                        <TableHead>Rôle</TableHead>
                        <TableHead>Consultations</TableHead>
                        <TableHead className="min-w-[120px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {doctorsPagination.paginatedData.map((doctor) => {
                        const consultationCount = consultationsList.filter((c) => c?.medecinId === doctor.id).length
                        return (
                          <TableRow key={doctor.id}>
                            <TableCell>
                              {doctor.prenom}
                            </TableCell>
                            <TableCell>
                              {doctor.nom}
                            </TableCell>
                            <TableCell>{doctor.specialite}</TableCell>
                            <TableCell>{doctor.telephone}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{doctor.role}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{consultationCount}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingItem(doctor)
                                    setIsNewItemOpen(true)
                                  }}
                                >
                                  <Edit className="h-4 w-4 text-blue-500" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeletingItem({ type: "doctor", item: doctor })}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                      {doctorsPagination.paginatedData.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            Aucun médecin trouvé
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="md:hidden space-y-4">
                  {doctorsPagination.paginatedData.map((doctor) => {
                    const consultationCount = consultationsList.filter((c) => c?.medecinId === doctor.id).length
                    return (
                      <MobileCard
                        key={doctor.id}
                        title={`Dr. ${doctor.prenom} ${doctor.nom}`}
                        subtitle={`${doctor.specialite}`}
                        content={[
                          { label: "Téléphone", value: doctor.telephone },
                          { label: "Rôle", value: doctor.role, type: "badge" },
                          { label: "Consultations", value: consultationCount, type: "badge" },
                        ]}
                        actions={{
                          onEdit: () => {
                            setEditingItem(doctor)
                            setIsNewItemOpen(true)
                          },
                          onDelete: () => setDeletingItem({ type: "doctor", item: doctor }),
                        }}
                      />
                    )
                  })}
                  {doctorsPagination.paginatedData.length === 0 && (
                    <div className="text-center text-muted-foreground">
                      Aucun médecin trouvé
                    </div>
                  )}
                </div>
                {doctorsSearch.filteredData.length > doctorsPagination.itemsPerPage && (
                <TablePagination
                  pagination={doctorsPagination}
                  totalRows={doctorsSearch.filteredData.length}
                />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div>
                    <CardTitle>Utilisateurs</CardTitle>
                    <CardDescription>Liste des utilisateurs du système</CardDescription>
                  </div>
                  <Dialog
                    open={isNewItemOpen && activeTab === "users"}
                    onOpenChange={(open) => {
                      setIsNewItemOpen(open)
                      if (!open) setEditingItem(null)
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button className="w-full sm:w-auto">
                        <Plus className="h-4 w-4 mr-2" />
                        Nouvel Utilisateur
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl h-full overflow-y-auto sm:max-h-[90vh]">
                      <DialogHeader>
                        <DialogTitle>{editingItem ? "Modifier" : "Nouveau"} Utilisateur</DialogTitle>
                        <DialogDescription>
                          {editingItem ? "Modifier les informations de l'utilisateur" : "Ajouter un nouvel utilisateur"}
                        </DialogDescription>
                      </DialogHeader>
                      <UserForm
                        isLoading={isLoading}
                        userEdit={editingItem}
                        onClose={() => {
                          setIsNewItemOpen(false)
                          setEditingItem(null)
                        }}
                        onSave={(item) => {
                          if (editingItem) {
                            handleUpdateUser(item)
                          } else {
                            handleAddUser(item)
                          }
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <GlobalSearch
                  searchTerm={usersSearch.searchTerm}
                  onSearchChange={usersSearch.setSearchTerm}
                  filters={usersSearch.filters}
                  onFilterChange={usersSearch.updateFilter}
                  onClearFilters={usersSearch.clearFilters}
                  filterOptions={filterConfigs.users.filterOptions}
                  placeholder="Rechercher par nom, prénom ou email"
                />

                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Prénom</TableHead>
                        <TableHead>Nom</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Rôle</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersPagination.paginatedData.map((user) => {
                        return (
                          <TableRow key={user.id}>
                            <TableCell>{user.prenom}</TableCell>
                            <TableCell>{user.nom}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{user.role}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingItem(user)
                                    setIsNewItemOpen(true)
                                  }}
                                >
                                  <Edit className="h-4 w-4 text-blue-500" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeletingItem({ type: "user", item: user })}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                      {usersPagination.paginatedData.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            Aucun utilisateur trouvé
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>

                <div className="md:hidden space-y-4">
                  {usersPagination.paginatedData.map((user) => {
                    return (
                      <MobileCard
                        key={user.id}
                        title={`${user.prenom} ${user.nom}`}
                        content={[
                          { label: "Email", value: user.email },
                          { label: "Rôle", value: user.role, type: "badge" }
                        ]}
                        actions={{
                          onEdit: () => {
                            setEditingItem(user)
                            setIsNewItemOpen(true)
                          },
                          onDelete: () => setDeletingItem({ type: "user", item: user }),
                        }}
                      />
                    )
                  })}
                  {usersPagination.paginatedData.length === 0 && (
                    <div className="text-center text-muted-foreground">
                      Aucun utilisateur trouvé
                    </div>
                  )}
                </div>

              {usersSearch.filteredData.length > usersPagination.itemsPerPage && (
                <TablePagination
                  pagination={usersPagination}
                  totalRows={usersSearch.filteredData.length}
                />
              )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

        <EmployeeHistoryModal
          employee={selectedEmployeeHistory}
          isOpen={!!selectedEmployeeHistory}
          onClose={() => setSelectedEmployeeHistory(null)}
        />

        <ConsultationInfo
          consultation={selectedConsultation}
          isOpen={!!selectedConsultation}
          onClose={() => setSelectedConsultation(null)}
        />

        {deletingItem && (
          <AlertDialog open={true} onOpenChange={() => setDeletingItem(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Supprimer{" "}
                  {deletingItem.type === "employee"
                    ? "l'employé"
                    : deletingItem.type === "doctor"
                      ? "le médecin"
                      : deletingItem.type === "user"
                        ? "l'utilisateur"
                        : "la consultation"}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleDelete(deletingItem.type, deletingItem.item.id)} className="bg-red-500 text-white hover:bg-red-600">
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {isLogoutDialogOpen && (
          <AlertDialog open={isLogoutDialogOpen} onOpenChange={() => setIsLogoutDialogOpen(false)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Déconnexion</AlertDialogTitle>
                <AlertDialogDescription>
                  Êtes-vous sûr de vouloir vous déconnecter ?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogout} className="bg-red-500 text-white hover:bg-red-600">
                  Déconnexion
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          type="report"
          consultations={consultationsList}
        />

        <ReportModal
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
          type="invoice"
          consultations={consultationsList}
        />
      </div>
    </div>
  )
}

function EmployeeForm({
  isLoading,
  employee,
  onClose,
  onSave,
}: { employee?: any; onClose: () => void; onSave: (item: any) => void; isLoading?: boolean }) {
  const [formData, setFormData] = useState({
    matricule: employee?.matricule || "",
    nom: employee?.nom || "",
    prenom: employee?.prenom || "",
    intituleUnite: employee?.intituleUnite || "",
    emploiOccupe: employee?.emploiOccupe || "",
    intituleDepartement: employee?.intituleDepartement || "",
    civilite: employee?.civilite || "M",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!employee) {
      onSave(formData)
    } else {
      onSave({ ...employee, ...formData })
    }
  }

  return (
    <form className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="matricule">Matricule</Label>
        <Input
          id="matricule"
          value={formData.matricule}
          onChange={(e) => setFormData({ ...formData, matricule: e.target.value })}
          required
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="prenom">Prénom</Label>
          <Input
            id="prenom"
            value={formData.prenom}
            onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nom">Nom</Label>
          <Input
            id="nom"
            value={formData.nom}
            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="intituleUnite">Intitulé Unité</Label>
          <Input
            id="intituleUnite"
            value={formData.intituleUnite}
            onChange={(e) => setFormData({ ...formData, intituleUnite: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="emploiOccupe">Emploi Occupé</Label>
          <Input
            id="emploiOccupe"
            value={formData.emploiOccupe}
            onChange={(e) => setFormData({ ...formData, emploiOccupe: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="intituleDepartement">Intitulé Département</Label>
          <Input
            id="intituleDepartement"
            value={formData.intituleDepartement}
            onChange={(e) => setFormData({ ...formData, intituleDepartement: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="civilite">Civilité</Label>
          <Select value={formData.civilite} onValueChange={(value) => setFormData({ ...formData, civilite: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une civilité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Monsieur">Monsieur</SelectItem>
              <SelectItem value="Madame">Madame</SelectItem>
              <SelectItem value="Mademoiselle">Mademoiselle</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto bg-transparent" disabled={isLoading}>
          Annuler
        </Button>
        <Button type="submit" onClick={handleSubmit} className="w-full sm:w-auto" disabled={isLoading}>
          {employee ? "Modifier" : "Ajouter"}
        </Button>
      </div>
    </form>
  )
}

function DoctorForm({ isLoading, doctor, onClose, onSave }: { doctor?: any; onClose: () => void; onSave: (item: any) => void; isLoading?: boolean }) {
  const [formData, setFormData] = useState({
    nom: doctor?.nom || "",
    prenom: doctor?.prenom || "",
    specialite: doctor?.specialite || "",
    telephone: doctor?.telephone || "",
    role: doctor?.role || ""
  })


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!doctor) {
      onSave(formData)
    } else {
      onSave({ ...doctor, ...formData })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="prenom">Prénom</Label>
          <Input
            id="prenom"
            value={formData.prenom}
            onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nom">Nom</Label>
          <Input
            id="nom"
            value={formData.nom}
            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="specialite">Spécialité</Label>
          <Input
            id="specialite"
            value={formData.specialite}
            onChange={(e) => setFormData({ ...formData, specialite: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Rôle</Label>
          <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un rôle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="medecin">Médecin</SelectItem>
              <SelectItem value="infirmier">Infirmier</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="telephone">Téléphone</Label>
        <Input
          id="telephone"
          type="tel"
          value={formData.telephone}
          onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
          required
        />
      </div>

      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto bg-transparent" disabled={isLoading}>
          Annuler
        </Button>
        <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
          {doctor ? "Modifier" : "Ajouter"}
        </Button>
      </div>
    </form>
  )
}

function UserForm({
  isLoading,
  userEdit,
  onClose,
  onSave,
}: { userEdit?: any; onClose: () => void; onSave: (item: any) => void; isLoading?: boolean }) {
  const [formData, setFormData] = useState({
    nom: userEdit?.nom || "",
    prenom: userEdit?.prenom || "",
    email: userEdit?.email || "",
    role: userEdit?.role || "user",
    password: userEdit?.password || "",
    repassword: userEdit?.repassword || "",
  })

  const { user } = useAuth()
  const isAdmin = user?.role === "admin"

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!userEdit) {
      onSave(formData)
    } else {
      onSave({ ...userEdit, ...formData })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="prenom">Prénom</Label>
          <Input
            id="prenom"
            value={formData.prenom}
            onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nom">Nom</Label>
          <Input
            id="nom"
            value={formData.nom}
            onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Rôle</Label>
          <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un rôle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">Utilisateur</SelectItem>
              {isAdmin && (
                <SelectItem value="admin">Administrateur</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
      {!userEdit && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Mot de passe</Label>
            <Input
              id="phone"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="repassword">Confirmer le mot de passe</Label>
            <Input
              id="repassword"
              type="password"
              value={formData.repassword}
              onChange={(e) => setFormData({ ...formData, repassword: e.target.value })}
            />
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto bg-transparent" disabled={isLoading}>
          Annuler
        </Button>
        <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
          {userEdit ? "Modifier" : "Ajouter"}
        </Button>
      </div>

    </form>
  )
}