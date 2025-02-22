# Warpportal

## **Phase Alpha (-1): Demo and Basic Authentication**

### **🔹 Client Access Agent and Admin Portal**

Deploy Demo-Ware Tech Stack:

- Fullstack Typescript.
- Next.js
- tRPC
- Prisma ORM with PostgreSQL.
- Vercel for deployment.

Users download a **custom SSH agent** that:

- Requests and obtains **short-lived SSH certificates**.
- Communicates with our SaaS to fetch certs **on-demand**.
- `warp ssh <node>` to connect to registered nodes.
  - add custom information to `~/.ssh/config` to use our agent.

Placeholder API services

- **User Directory API** for managing users, groups, roles, and tags.
- **Certificate Authority API** that users can query for new certs.

## **Phase Beta (0): Publicly Accessible Nodes & Core SSH Features**

### **🔹 Custom SSH Agent on Client Machines**

Users authenticate via our **CLI (`warp ssh`)** for transparent certificate issuance:

- Integrates with **IDPs** (Okta, Google, Azure AD).
- Intercepts `ssh-agent` requests and **replaces them with our agent**.
- **Signs and loads SSH certificates into \*\***`ssh-agent`\*\*.

### **🔹 Machine Registration & Management Agent**

A **CLI-based agent** (`warp agent`) is deployed on all managed machines to:

- **Register the machine** with our service.
- **Configure OpenSSH to trust our CA** by updating `/etc/ssh/sshd_config`.
- **Ensure machines only accept certificates with valid principals**.
- **Monitor SSH sessions** and log activity in real-time.
- **Rotate CA keys** periodically for enhanced security.
- **Automatically provision** user management NS & PAM modules.

## **Phase 1: Policy Enforcement & Access Controls**

### **🔹 Server-Side CA & Policy Engine**

- A **Root Certificate Authority (CA)** is responsible for:
  - Signing user SSH certificates **only for approved nodes**.
  - Enforcing policies such as **allowed roles, sudo control, and session duration**.
- Policy enforcement is dynamic:
  - Users receive **certificates only for permitted machines**.
  - **If revoked, access is instantly lost** (certs expire).

## **Phase 2: Bastion Support for Private Nodes**

### **🔹 Proxy Host for Internal Machines**

For machines **not accessible externally**, we will:

- Deploy a **proxy SSH host** that relays connections.
- Modify `warp agent` to **automatically route requests via the proxy**.
- Use the same **certificate-based authentication model**, ensuring security remains intact.

### **🔹 Automatic Bastion Discovery & Routing**

- When registering a node, Warp detects if it is **behind a private network**.
- If the node is private, Warp **suggests an appropriate bastion** automatically.
- Users can still manually specify a bastion via `ssh -J user@bastion.example.com user@internal-server`.
- Warp issues certificates that allow access to both the bastion and the private node.

## **Phase 3: Fully Isolated Node Support**

### **🔹 Workarounds for Totally Locked-In Nodes**

For nodes that are completely isolated with no internet access, possible workarounds include:

- **Internal Routing:** Configuring private routes within the VPC to allow communication between the node and a registered bastion.
- **Out-of-Band Registration:** Manually associating an unreachable node with a bastion by registering it from a machine that does have network access.
- **Periodic Sync via an Intermediate Node:** Using a registered node within the VPC as a relay to periodically sync data with Warp.
- **VPN or Peered Networks:** Setting up a VPN connection to allow managed nodes to communicate with Warp's registration service.
- **Cloud-Specific Solutions:** Leveraging cloud-native services like AWS Systems Manager Session Manager or Azure Bastion to establish control over isolated nodes.

By structuring our roadmap in this way, we ensure that Warp Portal first meets the most common use cases while progressively adding more complex features for private and locked-in networks.
