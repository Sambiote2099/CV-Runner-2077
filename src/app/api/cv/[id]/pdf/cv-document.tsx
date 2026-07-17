import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer"

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#111",
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: "#6b7280",
  },
  qr: {
    width: 70,
    height: 70,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
    marginTop: 16,
    color: "#1d4ed8",
  },
  row: {
    flexDirection: "row",
    marginBottom: 6,
  },
  label: {
    width: 140,
    fontFamily: "Helvetica-Bold",
    color: "#374151",
  },
  value: {
    flex: 1,
    color: "#111",
  },
  emptyValue: {
    flex: 1,
    color: "#ef4444",
  },
  projectCard: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 4,
    padding: 10,
    marginBottom: 8,
  },
  projectName: {
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
  },
  projectDate: {
    color: "#6b7280",
    fontSize: 10,
    marginBottom: 4,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 4,
  },
  tag: {
    backgroundColor: "#eff6ff",
    color: "#1d4ed8",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    fontSize: 9,
  },
  description: {
    color: "#374151",
    fontSize: 10,
    lineHeight: 1.5,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 9,
    color: "#9ca3af",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
})

type Attribute = {
  name: string
  value: string
  type: string
}

type Project = {
  name: string
  startDate: Date | null
  endDate: Date | null
  description: string
  tags: string[]
}

type Props = {
  positionTitle: string
  candidateName: string
  status: string
  attributes: Attribute[]
  projects: Project[]
  qrDataUrl: string
  cvUrl: string
}

export default function CVDocument({
  positionTitle,
  candidateName,
  status,
  attributes,
  projects,
  qrDataUrl,
  cvUrl,
}: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{positionTitle}</Text>
            <Text style={styles.subtitle}>{candidateName}</Text>
            <Text style={styles.subtitle}>Status: {status}</Text>
          </View>
          {/* QR code links back to the live CV */}
          <Image src={qrDataUrl} style={styles.qr} />
        </View>

        {/* Attributes */}
        {attributes.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Profile</Text>
            {attributes.map((attr, i) => (
  <View key={i} style={styles.row}>
    <Text style={styles.label}>{attr.name}</Text>
    {!attr.value ? (
      <Text style={styles.emptyValue}>Not filled in</Text>
    ) : attr.type === "IMAGE" ? (
      // @react-pdf/renderer's Image component fetches the URL at render time
      // and embeds the actual image data in the PDF — the URL itself is never shown
      <Image src={attr.value} style={{ width: 80, height: 80, objectFit: "cover" }} />
    ) : (
      <Text style={styles.value}>{attr.value}</Text>
    )}
  </View>
))}
          </View>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>Projects</Text>
            {projects.map((project, i) => (
              <View key={i} style={styles.projectCard}>
                <Text style={styles.projectName}>{project.name}</Text>
                {(project.startDate || project.endDate) && (
                  <Text style={styles.projectDate}>
                    {project.startDate?.toLocaleDateString() ?? ""} —{" "}
                    {project.endDate?.toLocaleDateString() ?? "Present"}
                  </Text>
                )}
                {project.tags.length > 0 && (
                  <View style={styles.tags}>
                    {project.tags.map((tag, j) => (
                      <Text key={j} style={styles.tag}>{tag}</Text>
                    ))}
                  </View>
                )}
                {project.description && (
                  <Text style={styles.description}>
                    {/* Strip markdown symbols for PDF — plain text only */}
                    {project.description.replace(/[#*`_~>\[\]]/g, "")}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Footer with URL */}
        <View style={styles.footer}>
          <Text>Generated by CV Management System</Text>
          <Text>{cvUrl}</Text>
        </View>

      </Page>
    </Document>
  )
}